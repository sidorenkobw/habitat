#!/bin/bash

if [[ "$0" == /* ]]
then
    MYDIR=`dirname "$0"`
else
    MYDIR=`dirname "$PWD/$0"`
fi;

cd "$MYDIR"
echo "$MYDIR"
forever start --plain -w --watchDirectory . run.js
