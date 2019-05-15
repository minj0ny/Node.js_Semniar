const http = require('http');
const request = require('request');
const fs = require('fs');
const json2csv = require('json2csv');

const server = http.createServer((req, res) => {
    const options = {
        uri: 'http://15.164.75.18:3000/homework/2nd',
        method: 'GET',
    }

    request(options, (err, response, body) => {

        let data = {
            "msg": "",
            "resData": null,
            "resultCsv": null
        };

        if (err) {
            console.log(err);
            data.msg = "request 에러";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.write(JSON.stringify(data));
            res.end();
        } else {
            const resData = JSON.parse(body).data;
            data.resData = resData;
            // body = {"status":200,"success":true,"message":"현재시각","data":"2019-04-21 10:54:32"}
            // data = 2019-04-21 10:54:32
            const resultCsv = json2csv.parse({
                data: resData,
                fields: ["time"]
            });
            data.resultCsv = resultCsv;

            fs.writeFile('info.csv', resultCsv, (err) => {
                if (err) {
                    data.msg = "파일 저장 에러";
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.write(JSON.stringify(data));
                    res.end();
                } else {
                    data.msg = "파일 저장 success";
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.write(JSON.stringify(data));
                    res.end();
                }
            });
        }
    });
}).listen(3000, () => {
    console.log('3000포트와 연결 성공');
});