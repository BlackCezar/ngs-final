let comments = [];
const ipcRend = require('electron').ipcRenderer;
let accsId = [];

document.getElementById('getComments').onclick = function() {
    comments = [];
    let domen = document.getElementById('domen').value,
        recordId = document.getElementById('recordId').value,
        loader = document.querySelector('.loader');
    if (accsId.length == 0) ipcRend.send('getAccs');
    document.querySelector('.error').innerText = "";
    document.querySelector('.comments').innerHTML = "";
    document.getElementById('getComments').disabled = true;
    loader.style.opacity = 1;
    if (!recordId) {
        document.querySelector('.error').innerText = 'Введите номер поста';
        document.getElementById('getComments').disabled = false;
        return false;
    }
    fetch(domen + recordId)
    .then(resp => {
        if (resp.status == 200) return resp.json();
        document.querySelector('.error').innerText = 'Произошла ошибка при загрузке комментариев';
        throw Error(resp);
    }).then(json => {
        for (let comment of json.result.data["parent_comments.data"].data) {
            comments.push(comment)
            getChilds(comment);
            
        }
        loader.style.opacity = 0;
        startPushing();
        document.getElementById('getComments').disabled = false;
    }).catch(err => {
        console.log(err)
        document.getElementById('getComments').disabled = false;
    })
}

function getChilds(comment) {
        let row = "";
        let domen = document.getElementById('domen').value;
        if (domen == "https://newsapi.ngs.ru/v1/pages/jtnews/comments/?regionId=54&recordId=") {
            row = "https://newsapi.ngs.ru/v1/public/jtnews/services/comments/" + comment.id + "/children?regionId=54";
        } else row = "https://newsapi.ngs24.ru/v1/public/jtnews/services/comments/" + comment.id + "/children?regionId=24"
        fetch(row).then( resp2 => {
            if (resp2.status == 200) return resp2.json();
            document.querySelector('.error').innerText = 'Произошла ошибка при загрузки комментариев';
            throw Error(resp2);
        }).then(json2 => {
            if (json2.data) {
                for (com of json2.data) {
                    comments.push(com)
                    getChilds(com)
                    if (com.user.id > 0) {
                        let insertAccsId = true;
                        for (acc of accsId) {
                            if (acc == com.user.id) insertAccsId = false;
                        }
                        if (insertAccsId ) accsId.push(com.user.id)
                    }
                }
            }
            startPushing();
        })
        .catch(err => {
            console.log(err)
        })
}

function filter() {
    let inp = document.querySelector('.search').value;
    if (inp != "" || inp != " ") {
        for (comm of document.querySelectorAll('.comment')) {
            if (comm.querySelector('.nick').innerText == inp) {
                comm.style.display = 'unset';
            } else comm.style.display = 'none';
        }
    } else {
        for (comm of document.querySelectorAll('.comment')) {
            comm.style.display = 'unset'
        }
    }
}

function startPushing() {
    let domen = document.getElementById('domen').value;
    document.querySelector('.comments').innerHTML = " ";
    for (comment of comments) {
        let div = document.createElement("div")
        div.className = "comment"; 

        div.innerHTML = `
            <div class="header">
                <div class="nick">${comment.user.nick}</div>
                <div class="date">${comment.date}</div>
                <div class="plus">${comment.votesPlus}</div>
                <div class="minus">${comment.votesMinus}</div>
            </div>
            <div class="text">${comment.text}</div>
            <div class="row">
                <input type="number" class="current">
                <button class="btn" onclick="changeVote('plus', ${comment.id}, this)">Увеличить</button>
                <button class="btn" onclick="changeVote('minus', ${comment.id}, this)">Уменьшить</button>
            </div>
        `;
        if (comment.user.id > 0) {
            let insertAccsId = true;
            for (acc of accsId) {
                if (acc == comment.user.id) insertAccsId = false;
            }
            if (insertAccsId) accsId.push(comment.user.id)
        }
        updateAviable();
        document.querySelector('.comments').appendChild(div);
    }
}

ipcRend.on('getAccs', (event, accs) => {
    let domen = document.getElementById('domen').value;
    for (acc of accs) {
        let br = "Basic " + btoa(acc.split(" ")[0] + ':' + acc.split(" ")[1]);
        let row;

        if (domen == "https://newsapi.ngs.ru/v1/pages/jtnews/comments/?regionId=54&recordId=") {
                    row = "https://newsapi.ngs.ru/v1/public/account/?regionId=54";
                } else row = "https://newsapi.ngs24.ru/v1/public/account/?regionId=24";
        fetch(row, 
            {method: "post", 
                headers: {
                    "Authorization": br,
                    "Accept": "application/json, text/plain, */*, vnd.news.v1.jtnews+json"
                }
            }
        ).then(res => {
            if (res.status == 200) return res.json();
            document.querySelector('.error').innerText = 'Произошла ошибка при загрузке аккаунтов';
            throw Error(res);
        }).then(user => {
            if (user.userId > 0) {
                let insertAccsId = true;
                for (acc of accsId) {
                    if (acc == user.userId) insertAccsId = false;
                }
                if (insertAccsId) accsId.push(user.userId)
            }
            updateAviable();
        }).catch(err => console.log(err))
    }
})

async function changeVote(type, commentId, btn) {
    let recordId = document.getElementById('recordId').value,
        regionId = 24;
    if (type == "plus") type = 1
    if (type == "minus") type = -1
    if (domen == "https://newsapi.ngs.ru/v1/pages/jtnews/comments/?regionId=54&recordId=") {
        regionId = 54;
        row = `https://newsapi.ngs.ru/v1/public/records/${recordId}/comments/vote/`;
    } else row = `https://newsapi.ngs24.ru/v1/public/records/${recordId}/comments/vote`;
    let current = btn.parentElement.querySelector('.current').value;
    for (let i = 0; i < current && i < accsId.length; i++) {
        await fetch(row, 
            {method: "put", 
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    "Accept": "application/json, text/plain, */*, vnd.news.v1.jtnews+json"
                },
                body: JSON.stringify({
                    "commentId":    Number(commentId),
                    "regionId": regionId,
                    "user": Number(accsId[i]),
                    "vote": Number(type)
                    })
            }
        ).then(res => {
            if (res.status == 200) return res.json();
            throw Error(res);
        }).then(comment => {
            btn.parentElement.parentElement.querySelector('.plus').innerText = comment.votesPlus;
            btn.parentElement.parentElement.querySelector('.minus').innerText = comment.votesMinus;
        }).catch(err => {console.log(err); current++;})
    }

}


function updateAviable() {
    document.querySelector('.aviable').innerText = accsId.length;
}