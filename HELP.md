ssh corey@newmedia.doesntexist.com
cd  /home/palli/compost/compostpile/
sg compost -c 'killall node'
sg compost -c 'nohup npm start &'