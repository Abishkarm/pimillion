# Pi Billion

Explore one billion decimal digits of pi on GitHub Pages. Digits load automatically; no file picker or application server is needed.

## Publishing

The Publish Pi Billion workflow runs on pushes to main and can also be started manually. It downloads the billion-digit release attachment, verifies the entire source SHA-256, splits it into 1,000 compressed sections and deploys the static dist folder to GitHub Pages. Keep the repository's Pages publishing source set to GitHub Actions.

The browser requests only sections needed for browsing, searching, random numbers or the Heads/Tails game. It checks each section's SHA-256 before decompressing it. All requests stay on the website's own origin. The first section supplies the labeled million-digit frequency sample. At most eight decompressed sections are cached in memory.

Search supports a chosen interval across all billion positions and includes a Stop search button. A full scan transfers hundreds of megabytes, so smaller ranges finish faster. A current browser supporting DecompressionStream is required.

## Local preview

Use Node.js 20 or newer. No packages are required:

    node build-pages.cjs /path/to/pi-1b.txt
    node server.cjs

Open http://127.0.0.1:12021/. The local server only serves the same static files used on GitHub Pages. The generated dist directory is ignored by Git; GitHub Actions builds it during publication.

## Digit source

GitHub release: https://github.com/Abishkarm/pimillion/releases/tag/pi-digits-1b
Original source: https://calculat.io/storage/pi/1b.txt
Size: 1,000,000,000 bytes. Position 1 is the first digit after the decimal point; the integer 3 and decimal point are omitted.
SHA-256: ef0a513ee398d5dbe1ed6994c222e03a16fcfe91f5de685691953d35961798e5

Choose Heads or Tails using the separate buttons beside the centered coin. Even digits mean heads and odd digits mean tails. Each result shows the sampled digit and decimal position. This mapping is not guaranteed to be an exactly fair coin.

## Full digit file in this repository

pibillion.txt contains exactly 1,000,000,000 decimal digits and is tracked using Git LFS because it exceeds GitHub’s normal file size limit. Install Git LFS before cloning to retrieve the complete file, or use the file’s Download button on GitHub. Its SHA-256 matches the source above. GitHub may show the small LFS reference in its code viewer; the downloaded LFS object is the full billion-digit file. The website continues serving compressed sections automatically.

generate-pi.cjs is an optional million-digit sample generator. It writes pi-million.txt and never replaces the billion-digit file.
