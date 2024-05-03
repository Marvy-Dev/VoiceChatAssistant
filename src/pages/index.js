import { useEffect, useState } from "react";


import { AudioInput } from "@/components";

async function calculateSHA256(blob) {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
export default function Home() {
  const [speechValue, setSpeechValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [myAudio, setMyAudio] = useState(null);
  const [textFoundedInAudio, setTextFoundedInAudio] = useState("");
  const [loadingConversion, setLoadingConversion] = useState(false);
  const [animatedText, setAnimatedText] = useState('');

  useEffect(() => {

    for (let i = 0; i < textFoundedInAudio.length; i++) {
      setTimeout(() => {
        setAnimatedText(textFoundedInAudio.substring(0, i + 1));
      }, i * 100);
    }

  }, [textFoundedInAudio]);

  const getMyAudio = async (audioUrl) => {
    setLoadingConversion(true)
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const hash = await calculateSHA256(blob);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const binaryString = bytes.reduce((str, byte) => {
      return str + String.fromCharCode(byte);
    }, '');
    const base64String = btoa(binaryString);
    const JSONtoSend = {
      hash,
      audio: base64String
    }


    // const formData = new FormData();
    // formData.append('file', blob);
    // formData.append('hash', hash);

    fetch("http://localhost:5000/myfile", {
      // fetch("http://localhost:5000/showAudio", {
      method: 'POST',
      body: JSON.stringify(JSONtoSend),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => {
      // Print the base64 string of the audio in sha256 format
      console.log('====================================');
      console.log('Returning response from server');
      console.log(response);
      console.log('====================================');
      return response.json();
    }).then(data => {
      console.log('===============ALL DATA=====================');
      console.log(data);
      console.log('====================================');
      setTextFoundedInAudio(data?.text || '')
      setLoadingConversion(false)
    })
      .catch(error => {
        console.error('====Error================================');
        console.error(error);
        console.error('====================================');
        setLoadingConversion(false)
      })

    return response;
  }
  const sendRequest = (e) => {
    e.preventDefault()
    setIsLoading(true)
    console.log('====================================');
    console.log('Sending request');
    console.log('====================================');
    fetch(`http://localhost:5000/getAudio?prompt=${speechValue}`)
      .then(res => res.blob())
      .then((myBlob) => {
        const objectURL = URL.createObjectURL(myBlob);
        const newAudioURL = objectURL;
        setMyAudio(newAudioURL)
        console.log('==========newAudio==========================');
        console.log(newAudioURL);
        console.log('====================================');
      }).catch(error => {
        console.error('====Error================================');
        console.error(error);
        console.error('====================================');
      })

      .finally(() => {
        setIsLoading(false)
      })

    console.log('====================================');
    console.log(speechValue);
    console.log('====================================');
  }
  const sendRequestTTS = async (audioUrl) => {
    const blobAudio = await getMyAudio(audioUrl)

  }
  return (
    <main
      className={ `flex min-h-screen flex-col items-center justify-between p-24` }
    >


      <div className="w-full max-w-xs">

        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" >
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="Speech">
              Write a Speech
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="Speech"
              type="text"
              placeholder="Speech"
              value={ speechValue }
              onChange={ e => setSpeechValue(e?.target?.value || "") }
            />
          </div>
          <div className="inputContainer" >
            <button
              disabled={ isLoading }
              className="formSubmitInput shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
              type="submit"
              value="Crear Audio"
              onClick={ sendRequest }
            >

              {
                isLoading ? <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-[#ffffff9c] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"></div> : "Crear Audio"
              }
            </button>
          </div>


        </form>
        {
          myAudio && <audio id="audio" src={ myAudio } controls />
        }
      </div>

      <div>

        <AudioInput sendRecordToApi={ e => {
          sendRequestTTS(e)
        } }
          isLoading={ loadingConversion }
        />
        <div className="bg-w-100">
          <h1>
            Texto Encontrado en el audio: <br />
          </h1>
          <p>
            { animatedText }
          </p>
        </div>

      </div>

    </main>
  );
}
