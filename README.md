# Pimillion

Explore one billion decimal digits of pi, search digit sequences, pick random numbers and play heads or tails with one shared coin.

## Run

Use Node.js 20 or newer. No packages are required:

    node server.cjs

Open http://127.0.0.1:12021/. The server retrieves small byte ranges from the repository's billion-digit release attachment. It follows GitHub's asset redirects, validates ranges, and caches up to eight responses. It does not download the entire file at startup.

Digit source: https://github.com/Abishkarm/pimillion/releases/download/pi-digits-1b/pi-1b.txt
Original source: https://calculat.io/storage/pi/1b.txt
Size: 1,000,000,000 bytes. Position 1 is the first digit after the decimal point; the integer 3 and decimal point are omitted.
SHA-256: ef0a513ee398d5dbe1ed6994c222e03a16fcfe91f5de685691953d35961798e5

For server hosting, set PORT and HOST as needed. Static hosting such as GitHub Pages cannot run this server. On a static host, download the release file and open it with the page's file picker; it reads small slices locally without uploading the file.

The explorer, random picker and coin game support positions 1–1,000,000,000. Search is streamed in million-digit blocks, with adjustable bounds and a Stop search button. Scanning all billion digits can transfer up to 1 GB. The chart shows frequencies in the first million digits as a labeled sample.

Choose Heads or Tails with the separate buttons beside the centered coin. Even digits mean heads and odd digits mean tails; the sampled digit and its decimal position are shown with each result. This mapping is not guaranteed to produce an exactly fair coin.
