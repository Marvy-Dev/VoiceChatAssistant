import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import "chart.js/auto";

let globalStream = null;
let globalRecorder = null;

const AudioInput = ({ sendRecordToApi, isLoading }) => {
  const [domLoaded, setDomLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(true);
  const [error, setError] = useState(null);
  const [audioData, setAudioData] = useState([]);
  const [chartData, setChartData] = useState({});
  const [audioUrl, setAudioUrl] = useState(null);

  const prepareRecorder = async () => {
    console.log('initializing recorder...');
    const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const newRecorder = new MediaRecorder(newStream);
    globalRecorder = newRecorder;
    globalStream = newStream;
    console.log('Recorder ready');
  }

  useEffect(() => {
    setDomLoaded(true);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsMicrophoneAvailable(false);
      setError('getUserMedia no está disponible en este navegador.');
      console.error('getUserMedia no está disponible en este navegador.');
      return;
    }
    else {
      prepareRecorder();
    }
  }, []);

  const withoutMicrophone = (
    <div className='bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 text-black'>
      <p className='bg-red-500'>Microphone is not available</p>
    </div>
  );
  const deleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };
  const toggleRecording = async () => {

    if (!isRecording) {

      // if globalRecorder was used previously, reinitialize it
      console.log('====================================');
      console.log('Recorder', globalRecorder);
      console.log('Stream', globalStream);
      console.log('====================================');
      if (globalRecorder?.state === 'inactive') {
        console.log('Reinicializando grabadora...');
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newRecorder = new MediaRecorder(newStream);
        globalRecorder = newRecorder;
        globalStream = newStream;
      }

      // Revocar el URL del blob anterior, si existe
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      try {
        // prepareRecorder();
        console.log('Configurando grabación...');
        globalRecorder.ondataavailable = e => {
          // when recording is stopped, and try to start a new recording with the same recorder instance it will throw an error because the recorder is in 'inactive' state 
          // so we need to create a new recorder instance for each recording
          // globalRecorder = new MediaRecorder(globalStream);

          const audioChunks = [];
          audioChunks.push(e.data);
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          console.log('Audio grabado:', url);
          setAudioUrl(url);
          // Aquí puedes enviar el audio a OpenAI para su procesamiento
        };

        globalRecorder.onstart = () => {
          const context = new AudioContext();
          const source = context.createMediaStreamSource(globalStream);
          const analyser = context.createAnalyser();
          source.connect(analyser);
          analyser.fftSize = 256;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const draw = () => {
            requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            setAudioData([...dataArray]);
          };

          draw();
        };

        globalRecorder.start();
        setIsRecording(true);
        console.log('Grabación iniciada.');
      } catch (error) {
        setError('Error al habilitar la captura de audio: ' + error.message);
        console.error('Error al habilitar la captura de audio:', error);
      }
    } else {
      console.log('Deteniendo grabación...');
      if (globalRecorder) {
        // stop using microphone
        globalStream.getTracks().forEach(track => track.stop());
        globalRecorder.stop();
        // setRecorder(null);
        setIsRecording(false);
        console.log('Grabación detenida.');
      }
      else {
        console.error('Recorder not available', isRecording);
      }
    }
  };
  const sendRecordToOpenAI = () => {
    if (!audioUrl) {
      console.error('No hay grabación para enviar a OpenAI.');
      return;
    }
    sendRecordToApi(audioUrl);
  };


  useEffect(() => {
    setChartData({
      labels: Array.from({ length: audioData.length }, (_, i) => i + 1),
      datasets: [
        {
          label: 'Audio Signal',
          data: audioData,
          pointRadius: 0,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.9
        }
      ]
    });
  }, [audioData]);

  return !domLoaded ? "" : !isMicrophoneAvailable ? withoutMicrophone : (
    <div className='bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 text-black'>
      <p>Graba un audio con tu microfono para pasarlo a texto</p>
      { error && <p className='bg-red-500'>{ error }</p> }
      <div className="speechContainer">
        <div>
          { isRecording && <Line options={ {
            scales: {
              // to remove the labels
              x: {
                ticks: {
                  display: false,
                },

                // to remove the x-axis grid
                grid: {
                  drawBorder: false,
                  display: false,
                },
              },
              // to remove the y-axis labels
              y: {
                ticks: {
                  display: false,
                  beginAtZero: true,
                },
                // to remove the y-axis grid
                grid: {
                  drawBorder: false,
                  display: false,
                },
              },
            }
          } } data={ chartData } /> }
        </div>
        { audioUrl && <audio controls src={ audioUrl } /> }
        <button
          onClick={ () => { toggleRecording() } }
          className={ `${isRecording ? "bg-red-500" : "bg-blue-500"} ${isRecording ? "hover:bg-red-700" : "hover:bg-blue-700"} text-white font-bold py-2 px-4 rounded-full` }
          type='button'>{ isRecording ? "Stop Recording" : "Start Recording" }</button>
        <button
          disabled={ !audioUrl }
          onClick={ () => {
            deleteAudio();
            console.log('Audio deleted');
          } }
          className={ `${isRecording ? "bg-red-500" : "bg-blue-500"} ${isRecording ? "hover:bg-red-700" : "hover:bg-blue-700"} text-white font-bold py-2 px-4 rounded-full` }
          type='button'>Delete Audio</button>
      </div>
      { audioUrl &&
        <button
          className={ `bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full` }
          onClick={ () => {
            sendRecordToOpenAI()
          } }
        >

          {
            isLoading ? <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-[#ffffff9c] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"></div> : "Convert speech to text"
          }
        </button>
      }
    </div>
  );
};

export default AudioInput;
