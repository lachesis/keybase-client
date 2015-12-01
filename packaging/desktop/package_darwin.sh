#!/bin/sh

set -e # Fail on error

dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $dir

client_dir="$dir/../.."
build_dir="$dir/build"
tmp_dir="$dir/tmp"

app_name=Keybase
app_version=$1
app_build=$2
version=$app_version-$app_build

if [ "$app_version" = "" ]; then
  echo "No app version specified"
  exit 1
fi

if [ "$app_build" = "" ]; then
  echo "No build version specified"
  exit 1
fi

out_dir="$build_dir/Keybase-darwin-x64"
shared_support_dir="$out_dir/Keybase.app/Contents/SharedSupport"
resources_dir="$out_dir/Keybase.app/Contents/Resources/"

keybase_url="https://github.com/keybase/client/releases/download/v$version/keybase-$version.tgz"
kbfs_url="https://github.com/keybase/kbfs-beta/releases/download/v1.0.0-27/kbfs-1.0.0-27.tgz"
installer_url="https://github.com/keybase/client/releases/download/v1.0.4-4/KeybaseInstaller-1.1.0-0.tgz"

keybase_bin="$tmp_dir/keybase"
kbfs_bin="$tmp_dir/kbfs"
installer_app="$tmp_dir/KeybaseInstaller.app"

clean() {
  echo "Cleaning"
  rm -rf $build_dir
  rm -rf $tmp_dir
  mkdir -p $build_dir
  mkdir -p $tmp_dir
}

get_deps() {
  cd $tmp_dir
  echo "Downloading dependencies"
  curl -J -L -Ss $keybase_url | tar zx
  curl -J -L -Ss $kbfs_url | tar zx
  curl -J -L -Ss $installer_url | tar zx
}

# Setup and build product for packaging
build() {
  cd $build_dir
  echo "Creating project"
  # Copy files from desktop and react-native project here
  rsync -av -L $client_dir/desktop . --exclude node_modules
  rsync -av -L $client_dir/react-native/react react-native --exclude node_modules
  # Copy icon files
  cp $client_dir/osx/Install/appdmg/Keybase.icns .

  # Move menubar icon into app path
  mv $build_dir/desktop/Icon*.png $build_dir

  # Copy and modify package.json to point to main from one dir up
  cp desktop/package.json .
  json -I -f package.json -e 'this.main="desktop/app/main.js"'

  echo "Npm install (including dev dependencies)"
  # Including dev dependencies for debug, we should use --production when doing real releases
  npm install #--production
}

# Build Keybase.app
package_electron() {
  cd $build_dir
  rm -rf $out_dir

  echo "Running Electron packager"
  # Package the app
  electron-packager . $app_name \
    --asar=true \
    --platform=darwin \
    --arch=x64 \
    --version=0.35.2 \
    --app-bundle-id=keybase.Electron \
    --helper-bundle-id=keybase.ElectronHelper \
    --icon=Keybase.icns \
    --app-version=$app_version \
    --build-version=$app_version-$app_build
}

# Adds the keybase binaries and Installer.app bundle to Keybase.app
package_app() {
  cd $build_dir
  mkdir -p $shared_support_dir/bin
  cp $keybase_bin $shared_support_dir/bin
  cp $kbfs_bin $shared_support_dir/bin
  mkdir -p $resources_dir
  cp -R $installer_app $resources_dir/KeybaseInstaller.app
}

sign() {
  cd $out_dir
  code_sign_identity="Developer ID Application: Keybase, Inc. (99229SGT5K)"
  codesign --verbose --force --deep --timestamp=none --sign "$code_sign_identity" $app_name.app
}

# Create dmg from Keybase.app
package_dmg() {
  cd $out_dir
  dmg_name="$app_name-$app_version-$app_build.dmg"
  appdmg="appdmg.json"

  osx_installer="$client_dir/osx/Install"
  cp $osx_installer/appdmg/$appdmg .
  cp $osx_installer/appdmg/Background.png .
  cp $osx_installer/appdmg/Keybase.icns .

  rm -rf $dmg_name
  appdmg $appdmg $dmg_name
}

clean
get_deps
build
package_electron
package_app
sign
package_dmg
open $out_dir