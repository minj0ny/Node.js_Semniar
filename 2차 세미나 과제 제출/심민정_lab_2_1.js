const http = require('http');
const querystring = require('querystring');
const url = require('url');
const crypto = require('crypto');

const server = http.createServer((req,res) =>{
    const urlParsed = url.parse(req.url);
    const queryParsed = querystring.parse(urlParsed.query); //예를 들어 'name=심민정' 을 가져옴
    const str = queryParsed.str; //'심민정' 만 가져옴

    let data={
        "msg": "",
        "hashed":null
    };// response 를 보낼 객체 

    crypto.randomBytes(32, (err,buf)=>{ //32바이트 길이의 랜덤한 값 생성
        if(err){
            console.log(err);
            data.msg = "randomBytes 에러";

            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');// 한글 깨짐 인코딩
            res.write(JSON.stringify(data));
            res.end();         
        }else{
            const salt = buf.toString('base64'); //salt 값 생성
            console.log(salt);
            crypto.pbkdf2(str,salt,10000,64,'SHA512',(err,hashed)=>{ //10000은 반복 횟수, 64는 키길이, 'SHA512'는 digest 를 의미
                if (err) {
                    console.log(err);
                    data.msg = "pbkdf2 에러";

                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.write(JSON.stringify(data));
                    res.end();
                } else {
                    data.msg = "암호화 success";
                    data.hashed = hashed.toString('base64');

                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.write(JSON.stringify(data));
                    res.end();
                }
            });
        }
    });
}).listen(3000,()=>{
    console.log('3000포트와 연결 성공');
});