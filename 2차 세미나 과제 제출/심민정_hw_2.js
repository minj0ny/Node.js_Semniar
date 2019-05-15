const http = require('http');
const querystring = require('querystring');
const url = require('url');
const crypto = require('crypto');
const json2csv = require('json2csv');
const fs = require('fs');
const request = require('request');
var csv = require('csvtojson');

const server = http.createServer((req, res) => {
    const urlParsed = url.parse(req.url);
    const queryParsed = querystring.parse(urlParsed.query);
    const id = queryParsed.id;
    const password = queryParsed.password;

    function print(message) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write(message);
        res.end();
    }

    let user = {
        "id": id,
        "password": password
    }

    if (urlParsed.pathname == '/signin/') {

        let data = {
            "msg": "",
            "resultCsv": null
        };

        crypto.randomBytes(32, (err, buf) => { //32바이트 길이의 랜덤한 값 생성
            if (err) {
                console.log(err);
                data.msg = "randomBytes 에러";
                print(JSON.stringify(data));
            } else {
                const salt = buf.toString('base64'); //salt 값 생성
                crypto.pbkdf2(user.password, salt, 10000, 64, 'SHA512', (err, hashed) => { //10000은 반복 횟수, 64는 키길이, 'SHA512'는 digest 를 의미
                    if (err) {
                        console.log(err);
                        data.msg = "pbkdf2 에러";
                        print(JSON.stringify(data));
                    } else {
                        data.msg = "암호화 성공";
                        const hashedPassword = hashed.toString('base64');
                        const resultCsv = json2csv.parse({
                            "id": id,
                            "hashedPassword": hashedPassword,
                            "salt": salt
                        });
                        data.resultCsv = resultCsv;

                        fs.writeFile('user.csv', resultCsv, (err) => {
                            if (err) {
                                print("파일 저장 에러");
                            } else {
                                print(`${user.id}님 회원가입이 성공적으로 완료되었습니다. :)`);
                            }
                        })
                    }
                });
            }
        });
    } else if (urlParsed.pathname == '/signup/') {
        csv()
            .fromFile("./user.csv")
            .then((jsonObj) => {
                console.log(jsonObj);
                let saltFromCSV = jsonObj[0].salt;
                let passwordFormCSV = jsonObj[0].hashedPassword;
                crypto.pbkdf2(user.password, saltFromCSV, 10000, 64, 'SHA512', (err, hashed) => {
                    if (err) {
                        console.log(err);
                        print("pbkdf2 에러");
                    } else {
                        const hashedPassword = hashed.toString('base64');
                        var msg = null;
                        if (hashedPassword == passwordFormCSV) {
                            print(`${user.id}님 환영합니다. :)`);
                        } else {
                            print("비밀번호가 일치하지 않습니다 :(");
                        }
                    }
                });
            });
    } else if (urlParsed.pathname == '/info') {
        var data = {
            "name": "심민정",
            "phone": "010-6798-2269"
        };
        const options = {
            uri: 'http://15.164.75.18:3000/homework/2nd',
            method: 'POST',
            body: data,
            json: true
        };

        request(options, (err, response, body) => {
            if (err) {
                console.log(err);
                print("requset 에러");
            } else {
                const status = body.status;
                if (status == 400) {
                    print("400 Error \n해당하는 회원이 없습니다. :(");
                } else if (status == 404) {
                    print("404 Error \n요청하신 페이지를 찾을 수 없습니다. :(  URL경로를 다시 확인해주세요 !!");
                } else if (status == 500) {
                    print("500 Error \n서버 내부에 오류가 있습니다. :(");
                } else if (status == 200) {
                    const student = body.data;
                    crypto.randomBytes(32, (err, buf) => { //32바이트 길이의 랜덤한 값 생성
                        if (err) {
                            console.log(err);
                            print("randomBytes 에러");
                        } else {
                            const salt = buf.toString('base64'); //salt 값 생성
                            crypto.pbkdf2(student.phone, salt, 10000, 64, 'SHA512', (err, hashed) => { //10000은 반복 횟수, 64는 키길이, 'SHA512'는 digest 를 의미
                                if (err) {
                                    console.log(err);
                                    print("pbkdf2 에러");
                                } else {
                                    hashedPhone = hashed.toString('base64');
                                    const studentCsv = json2csv.parse({
                                        name: student.name,
                                        colleage: student.colleage,
                                        major: student.major,
                                        email: student.email,
                                        hashedPhone: hashedPhone
                                    });
                                    fs.writeFile('student.csv', studentCsv, (err) => {
                                        if (err) {
                                            print("파일 저장 에러");
                                        } else {
                                            print(`${body.data.name}님 반갑습니다.:) \nstudent.csv 파일로 정보가 저장되었습니다.`);
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    print("오류로 인해 요청하신 서비스를 찾을 수 없습니다. :(");
                }
            }
        });
    }
}).listen(3000, () => {
    console.log('3000포트와 연결 성공');
});