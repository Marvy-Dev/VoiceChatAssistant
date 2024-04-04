import { useEffect, useState } from "react";

import Image from "next/image";
import { Inter } from "next/font/google";


const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [speechValue, setSpeechValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [myAudio, setMyAudio] = useState(null);
  // useEffect(() => {
  //   console.log('====================================');
  //   console.log(speechValue);
  //   console.log('====================================');
  // }, [speechValue]);
  const sendRequest = (e) => {
    e.preventDefault()
    setIsLoading(true)
    fetch(`https://audio-generator-api-26bd7e9ac21a.herokuapp.com/getAudio?prompt=${speechValue}`)
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
  return (
    <main
      className={ `flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}` }
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
                  class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-[#ffffff9c] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"></div> : "Crear Audio"
              }
            </button>
          </div>


        </form>
        {
          myAudio && <audio id="audio" src={ myAudio } controls />
        }
      </div>
    </main>
  );
}
