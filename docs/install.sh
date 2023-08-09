cd $HOME
repo=https://gitlab.com/thatonepuggo/dots
sep='--------------------------------'

echo $sep
echo 'installing dotfiles...'
echo $sep
git clone --bare $repo $HOME/.cfg
function config {
   git --git-dir=$HOME/.cfg/ --work-tree=$HOME $@
}
mkdir -p .config-backup
config checkout
if [ $? = 0 ]; then
    echo "Checked out config.";
else
    echo "Backing up pre-existing dot files.";
    config checkout 2>&1 | egrep "\s+\." | awk {'print $1'} | xargs -I{} mv {} .config-backup/{}
fi;
config checkout
config config status.showUntrackedFiles no

if [ "$(grep -E '^NAME=' /etc/os-release)" == "NAME=\"Arch Linux\"" ]; then
   echo $sep
   echo 'system is arch linux. getting paru..'
   echo $sep
   paru_d=$HOME/dev/paru
   sudo pacman -Syu
   mkdir $HOME/dev/
   git clone https://aur.archlinux.org/paru.git $paru_d
   cd $paru_d
   makepkg -si
fi
