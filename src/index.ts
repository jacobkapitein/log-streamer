import { exec } from 'child_process';

const isWindows = process.platform === 'win32';

const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
if (!urlArg) {
    console.error('Error: Missing --url argument');
    process.exit(1);
}
const streamerUrl = urlArg.split('=')[1];

const fetchLogs = async () => {
    let lastLogs = ""; // Keep track of the previous logs

    while (true) {
        try {
            const response = await fetch(streamerUrl, {
                method: 'GET',
                headers: {
                    cookie: process.env.STREAMER_COOKIE!,
                    "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0' // To avoid bot detection
                }
            });

            if (!response.ok) {
                console.error(`Failed to fetch logs: ${response.status} - ${response.statusText}`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }

            const text = await response.text();

            if (text !== lastLogs) {
                const newLogs = getNewLogs(lastLogs, text);
                if (newLogs) {
                    console.log(newLogs);
                    playSound(); // Play a sound when new logs are detected
                }
                lastLogs = text; // Update the last logs
            }

            // Wait for 3 seconds before polling again
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (err) {
            console.error('Error while fetching logs:', err);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
};

// Utility function to get new logs by comparing old and new text
const getNewLogs = (oldLogs: string, newLogs: string): string => {
    const oldLines = oldLogs.split('\n');
    const newLines = newLogs.split('\n');

    // Find the lines in `newLogs` that are not in `oldLogs`
    const startIndex = oldLines.length;
    return newLines.slice(startIndex).join('\n').trim();
};

const playSound = () => {
    if (!isWindows) return;

    exec('powershell -c (New-Object Media.SoundPlayer "C:\\Windows\\Media\\notify.wav").PlaySync();', (err) => {
        if (err) {
            console.error('Error playing sound:', err);
        }
    });
};

fetchLogs().catch(err => {
    console.error('Error in log polling:', err);
});
