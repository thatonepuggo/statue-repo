#!/usr/bin/env python3
import subprocess
import os
import pathlib
import re
import importlib.util

def mod_is_avail(mod, pkg_name=None):
    if not pkg_name:
        pkg_name = mod
    spec = importlib.util.find_spec(mod)
    if not spec:
        print(f"!!! could not find module {mod}! please install the python package {pkg_name}! !!!")
        exit(1)

mod_is_avail("distro")
import distro

if os.geteuid() == 0:
    exit("cannot run as root")

home = os.environ['HOME'] + '/'

cfg_dir = home + '/.cfg/'
config_backup_dir = home + '/.config-backup/'
yay_dir = home + '/dev/yay'

config_cmd = ["git", f"--git-dir={cfg_dir}", f"--work-tree={home}"]
repo = 'https://gitlab.com/thatonepuggo/dots'
yay_repo = 'https://aur.archlinux.org/yay.git'
sep = '--------------------------------'

print(sep)
print("installing dotfiles...")
print(sep)

subprocess.run(["git", "clone", "--bare", repo, cfg_dir])

pathlib.Path(config_backup_dir).mkdir(parents=True, exist_ok=True)

# backup existing dotfiles
try:
    subprocess.run(config_cmd + ["checkout"], check=True)
except subprocess.CalledProcessError as e:
    newproc = subprocess.run(config_cmd + ["checkout"], capture_output=True)
    for line in newproc.stderr.decode('utf-8').splitlines():
        if not re.fullmatch(r"\s+.+", line):
            continue
        item = line.strip()
        #print(split, split[0])

        # make parent dirs
        pathlib.Path(config_backup_dir + item).parents[0].mkdir(parents=True, exist_ok=True)

        os.rename(home + item, config_backup_dir + item)

subprocess.run(config_cmd + ["checkout"], check=True)
subprocess.run(config_cmd + ["config", "status.showUntrackedFiles", "no"], check=True)

print("success")

EXIT_BAD_EXITCODE = "exited with non-zero exit code"

if distro.id() == "arch" or distro.like() == "arch":
    print(sep)
    print("system is arch linux. getting yay..")
    print(sep)
    if os.system('sudo pacman -Syu --needed git base-devel') != 0:
        print(EXIT_BAD_EXITCODE)

    pathlib.Path(home + '/dev').mkdir(parents=True, exist_ok=True)
    
    os.chdir(home + '/dev')
    subprocess.run(['git', 'clone', yay_repo, yay_dir])
    os.chdir(yay_dir)
    if os.system('makepkg -si') != 0:
        print(EXIT_BAD_EXITCODE)
