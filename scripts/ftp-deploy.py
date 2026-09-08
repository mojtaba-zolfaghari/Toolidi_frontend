#!/usr/bin/env python3
"""
FTP Deployment Script.

Tries passive mode first (PASV) and falls back to active mode (PORT) —
GitHub Actions runners are behind NAT, so whether the data connection works
depends on the server's firewall: some refuse passive port ranges, others
cannot connect back for active mode. Uploading is idempotent, so retrying
the whole transfer in the other mode is safe.
"""
import os
import sys
import ftplib
from pathlib import Path

CONNECT_TIMEOUT = 60


def run_upload(server, username, password, local_dir, remote_dir, passive):
    mode_name = "passive (PASV)" if passive else "active (PORT)"
    print(f"Connecting to {server} — {mode_name} mode...")
    ftp = ftplib.FTP(server, timeout=CONNECT_TIMEOUT)
    ftp.login(username, password)
    ftp.set_pasv(passive)

    print(f"Creating remote directory: {remote_dir}")
    create_directory_recursive(ftp, remote_dir)
    ftp.cwd(remote_dir)
    print(f"Changed to: {remote_dir}")

    local_path = Path(local_dir)
    uploaded = 0

    for filepath in sorted(local_path.rglob('*')):
        if not filepath.is_file():
            continue
        rel_path = str(filepath.relative_to(local_path))
        print(f"Uploading: {rel_path}")

        remote_parent = remote_dir.rstrip('/') + '/' + os.path.dirname(rel_path)
        try:
            ftp.cwd(remote_parent)
        except ftplib.error_perm:
            create_directory_recursive(ftp, remote_parent)
            ftp.cwd(remote_parent)

        with open(filepath, 'rb') as f:
            ftp.storbinary(f'STOR {os.path.basename(rel_path)}', f)
        uploaded += 1

    print(f"\n✅ Successfully uploaded {uploaded} files ({mode_name})")
    ftp.quit()
    return uploaded


def main():
    server = os.environ.get('FTP_SERVER')
    username = os.environ.get('FTP_USERNAME')
    password = os.environ.get('FTP_PASSWORD')
    local_dir = os.environ.get('LOCAL_DIR', './dist')
    remote_dir = os.environ.get('REMOTE_DIR', '/home/ftpuser/toolidi/')

    if not all([server, username, password]):
        print("Error: Missing FTP credentials")
        sys.exit(1)

    # The FTP server does not accept passive mode (PASV). Default to active (PORT).
    # Only use passive if FTP_MODE=passive is explicitly set.
    forced = os.environ.get('FTP_MODE', '').strip().lower()
    modes = {'passive': [True], 'active': [False]}.get(forced, [False])  # [False] = active only

    last_error = None
    for passive in modes:
        try:
            run_upload(server, username, password, local_dir, remote_dir, passive)
            return
        except ftplib.all_errors as e:
            last_error = e
            mode_name = "passive" if passive else "active"
            print(f"⚠️ {mode_name} mode failed: {e}")
            if passive and len(modes) > 1:
                print("Retrying in active mode...")

    print(f"Error: all FTP modes failed — {last_error}")
    sys.exit(1)


def create_directory_recursive(ftp, path):
    """Create directory and all parent directories recursively"""
    parts = path.strip('/').split('/')
    current = ''
    for part in parts:
        current += '/' + part
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(part)
                ftp.cwd(current)
            except Exception as e:
                print(f"Warning: Could not create {current}: {e}")


if __name__ == '__main__':
    main()
