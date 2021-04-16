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
const storageRef = firebase.storage().ref()
const fileId = ID()


function uploadFile(file) {
    const ref = storageRef.child(fileId)
    const uploadTask = ref.put(file)
    uploadTask.on(
        'state_changed', 
        (snapshot) => setUploadProgress(snapshot), 
        (error) => console.error(error), 
        () => successfulUpload(ref, file.name)
    )
}


async function downloadFileFromStorage() {
    const fileRef = storageRef.child(fileId)
    const metadata = await getMetadata(fileRef)
    const { contentType, customMetadata: { fileName } } = metadata
    const url = await fileRef.getDownloadURL()
    downloadFile(url, fileName, contentType)
}


function downloadFile(url, fileName, contentType) {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'blob'
    xhr.onload = () => downloadComplete(xhr.response, fileName, contentType)
    xhr.onprogress = (e) => setDownloadProgress(e)
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
    download.setAttribute('progress', progress + '%')
}


function successfulUpload(ref, fileName) {
    container.classList.add('active')
    history.replaceState(undefined, '', `?ref=${fileId}`)
    ref.updateMetadata({
        customMetadata: {
            fileName
        }
    })
}


function setDownloadProgress(e) {
    if (e.lengthComputable) {
        let progress = ~~(100 - e.loaded / e.total * 100)
        root.style.setProperty('--progress', progress)
        upload.setAttribute('progress', progress + '%')
        download.setAttribute('progress', progress + '%')
    }
}


function downloadComplete(blob, fileName, contentType) {
    saveFile(blob, fileName, contentType)
    container.classList.remove('active')
    document.location.replace('/')
}


async function getMetadata(fileRef) {
    return await fileRef.getMetadata()
}


upload.addEventListener('drop', (e) => {
    uploadFile(e.dataTransfer.files[0])
    e.preventDefault()
})


upload.addEventListener('dragenter', (e) => {
    e.preventDefault()
})


upload.addEventListener('dragover', (e) => {
    e.preventDefault()
})


download.addEventListener('click', (e) => {
    downloadFileFromStorage()
})


function ID() {
    if (document.location.search !== '') {
        container.classList.add('active')
        root.style.setProperty('--progress', 100)
        return document.location.search.split('=')[1]    
    }
    return '_' + Math.random().toString(36).substr(2, 9)
}
