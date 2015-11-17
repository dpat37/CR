#!/bin/bash

recs=""

lftp sftp://hwl4zcx:qwBop12@153.2.212.162 -e "put some.file; bye"

if [ $? -eq 0 ]; then
	echo "Success"
	mail -s "Testing Success." dhruvpatel@ups.com <<< 'This is a test.'
else
	echo "Failure"
	mail -s "Testing Failed." dhruvpatel@ups.com <<< 'This is a test.'
fi
