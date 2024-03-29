const firebaseConfig = {
    apiKey: "AIzaSyA2pMMabP65Eriww5LGLQ2J1i8twddpxXc",
    authDomain: "streemio.firebaseapp.com",
    projectId: "streemio",
    storageBucket: "streemio.appspot.com",
    messagingSenderId: "815746485494",
    appId: "1:815746485494:web:906034e1668937e18bb0d7"
}
  // Initialize Firebase
firebase.initializeApp(firebaseConfig)


const root = document.documentElement
const upload = document.querySelector('.upload')
const download = document.querySelector('.download')
const container = document.querySelector('.container')
const back = document.querySelector('#back')
const storageRef = firebase.storage().ref()
const fileId = ID()
const fileUrl = document.location.origin + `/?ref=${fileId}`


function ID() {
    if (document.location.search !== '') {
        return document.location.search.split('=')[1]    
    }
    return '_' + Math.random().toString(36).substr(2, 9)
}


function pageInit() {
    if (document.location.search !== '') {
        container.classList.add('active')
        back.className = 'fas fa-cloud-download-alt'
        root.style.setProperty('--progress', 100)
        download.addEventListener('click', () => {
            downloadFileFromStorage()
        })
        return   
    }
    back.className = 'fas fa-copy'
    download.addEventListener('click', (e) => {
        copyToClipboard()
    })
}


async function uploadFile(file) {
    await sendNotification('Upload started', file.name)
    const ref = storageRef.child(fileId)
    const uploadTask = ref.put(file)
    uploadTask.on(
        'state_changed', 
        (snapshot) => setUploadProgress(snapshot), 
        () => showError(), 
        () => successfulUpload(ref, file.name)
    )
}


async function downloadFileFromStorage() {
    const fileRef = storageRef.child(fileId)
    const metadata = await getMetadata(fileRef)
    if (!metadata) return 
    const { contentType, customMetadata: { fileName } } = metadata
    await sendNotification('Download started', fileName)
    const url = await fileRef.getDownloadURL()
    downloadFile(url, fileName, contentType)
}


function downloadFile(url, fileName, contentType) {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'blob'
    xhr.onload = () => downloadComplete(xhr.response, fileName, contentType)
    xhr.onloadend = () => checkDownloadStatus(xhr.status)
    xhr.onprogress = (e) => setDownloadProgress(e)
    xhr.onerror = () => showError()
    xhr.open('GET', url)
    xhr.send()
}


function saveFile(blob, filename, contentType) {
    const file = new File([blob], filename, {
        type: contentType,
    })
    const link = document.createElement('a')
    link.download = file.name
    link.href = URL.createObjectURL(file)
    link.click()
    URL.revokeObjectURL(link.href)
}


function setUploadProgress({ bytesTransferred, totalBytes }) {
    let progress = ~~(bytesTransferred / totalBytes * 100)
    root.style.setProperty('--progress', progress)
    upload.setAttribute('progress', progress + '%')
}


async function successfulUpload(ref, fileName) {
    download.setAttribute('progress', 'Copy to clipboard')
    container.classList.add('active')
    root.style.setProperty('--progress', 0)
    history.replaceState(undefined, '', `?ref=${fileId}`)
    ref.updateMetadata({
        customMetadata: {
            fileName
        }
    })
    await sendNotification('Upload finished',fileName)
}


function setDownloadProgress(e) {
    if (e.lengthComputable) {
        let progress = ~~(100 - e.loaded / e.total * 100)
        root.style.setProperty('--progress', progress)
        upload.setAttribute('progress', progress + '%')
        download.setAttribute('progress', progress + '%')
    }
}


async function downloadComplete(blob, fileName, contentType) {
    saveFile(blob, fileName, contentType)
    await sendNotification('Download finished', fileName)
    container.classList.remove('active')
    document.location.replace('/')
}


function checkDownloadStatus(status) {
    if (status !== 200) {
        showError()
    }
}

async function getMetadata(fileRef) {
    try {
        return await fileRef.getMetadata()
    } catch (error) {
        showError()        
    }
}


async function copyToClipboard() {
    const textarea = document.createElement('textarea')
    textarea.visible = false
    document.body.appendChild(textarea)
    textarea.value = fileUrl
    textarea.select()
    document.execCommand('copy')
    await sendNotification('Copied to clipboard', fileUrl)
    document.body.removeChild(textarea)
    document.location.replace('/')
}


function openFileDialog() {
    const input = document.createElement('input')
    input.type = 'file'
    input.visible = false
    document.body.appendChild(input)
    input.onchange = async () => uploadFile(input.files[0])
    input.click()
    document.body.removeChild(input)
}


async function showError() {
    back.className = 'fas fa-exclamation-triangle'
    download.classList.add('error')
    root.style.setProperty('--progress', 0)
    download.addEventListener('click', () => document.location.replace('/'))
    await sendNotification('Something\'s going wrong!')
}


async function sendNotification(title = 'Streamio', message) {
    const notificationPermission =  await Notification.requestPermission()
    if (notificationPermission === 'granted') {
        new Notification(title, {
            body: message,
            icon: './assets/icon-192x192.png'
        })
    }
}

upload.addEventListener('click', (e) => {
    openFileDialog()
})


upload.addEventListener('drop', async (e) => {
    e.preventDefault()
    await uploadFile(e.dataTransfer.files[0])
})


upload.addEventListener('dragenter', (e) => {
    e.preventDefault()
})


upload.addEventListener('dragover', (e) => {
    e.preventDefault()
})


window.addEventListener('load', async () => {
    if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.register('../serviceworker.js')
          console.log('Service worker register success')
        } catch (e) {
          console.error('Service worker register fail')
        }
    }
    pageInit()
})
