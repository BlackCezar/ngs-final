const { app, BrowserWindow, session, ipcMain } = require('electron')
const fs = require('fs')
let win, accs
try {
  accs = fs.readFileSync('./auth.txt', "utf8").split("\n");
} catch (err) {
  console.log(accs);
  accs = []
}
const cookie = {url: "https://newsapi.ngs24.ru", name: "ngs_uid", value: "rBCY8VynkAtLG8JFBlULAg==", domain: ".ngs24.ru", path: "/", expires: "Mon, 02 Apr 2029 17:27:39 GMT"};
const cookie2 = {url: "https://newsapi.ngs.ru", name: "ngs_uid", value: "rBCY8VynkAtLG8JFBlULAg==", domain: ".ngs.ru", path: "/", expires: "Mon, 02 Apr 2029 17:27:39 GMT"}


function createWindow () {
  win = new BrowserWindow({ width: 800, height: 600 })
  win.loadFile(__dirname + '/index.html')

  
  session.defaultSession.cookies.set(cookie, (error) => {
    if (error) console.error(error)
  })
  session.defaultSession.cookies.set(cookie2, (error) => {
    if (error) console.error(error)
  })
  win.on('closed', () => {
    win = null
  })
}
app.on('ready', createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

ipcMain.on('getAccs', (event) => {
  event.sender.send('getAccs', accs)
})



// 89339953710 Константин