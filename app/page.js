'use client'
import styles from './typing.css'
import { useEffect, useState } from 'react'

export default function Typing() {
    let [wordbank, setWordBank] = useState([]);
    let [characterSpans, setCharacterSpans] = useState();
    let [numWords, setNumWords] = useState(25);
    let [started, setStarted] = useState(false);
    let [finished, setFinished] = useState(false);
    let [timeStarted, setTimeStarted] = useState(0);

    useEffect(() => {
        const spans = wordbank
        .map(word => [...word, ' '])
        .flat()
        .map((char, key) => (
            <span key={key}>{char}</span>
        ));
        if (numWords == 100) {
            document.querySelector('.wordBank').classList.add('smallerText');
        } else {
            document.querySelector('.wordBank').classList.remove('smallerText');
        }
        setCharacterSpans(spans);

    }, [wordbank]);

    useEffect(() => {
        window.scrollTo({top: 9999, behavior: 'smooth'});
    }, [characterSpans]);

    const handlePaste = (e) => {
        e.preventDefault();
        console.log("nice try bro");
    }

    const handleRadioChange = (e) => {
        const labels = document.querySelectorAll('label');
        labels.forEach(label => {
            label.classList.remove('checked');
            label.querySelector('input').disabled = false;
        })

        // A little hack to allow function to be used for keybind as well as radio button
        let label;
        if (e.target.parentElement) {
            label = e.target.parentElement;
        } else {
            label = Array.from(labels).find(label => label.innerText == e.target.value);
        }
        label.classList.add('checked');
        label.disabled = true;
        setNumWords(label.innerText);

        const textarea = document.querySelector('textarea');
        textarea.disabled = false;
        textarea.value = '';
        document.querySelectorAll('.correct').forEach(char => {
            char.classList.remove('correct');
        });

        document.querySelectorAll('.incorrect').forEach(char => {
            char.classList.remove('incorrect');
        });
        setFinished(false);
        setStarted(false);
    }

    const handleTyping = (e) => {
        if (!started) {
            setStarted(true);
            setTimeStarted(Date.now());
            document.querySelector('.retry').classList.remove('buttonDisabled');
            document.querySelector('.retry').disabled = false;
        }
        let typed = e.target.value.split('');
        const characters = document.querySelectorAll('span');
        let finished = true;
        characters.forEach((charSpan, charIndex) => {
            const typedChar = typed[charIndex];
            if (typedChar == null && charIndex != characters.length - 1) {
                characters[charIndex].classList.remove('incorrect');
                characters[charIndex].classList.remove('correct');
                finished = false;
            } else if (typedChar == charSpan.innerText) {
                characters[charIndex].classList.remove('incorrect');
                characters[charIndex].classList.add('correct');
            } else if (typedChar == ' ' && charSpan.innerText == null) {
                characters[charIndex].classList.remove('correct');
                characters[charIndex].classList.add('incorrect');
            } else {
                if (charSpan.innerText == ' ') charSpan.classList.add('space');
                characters[charIndex].classList.remove('correct');
                characters[charIndex].classList.add('incorrect');
            }
        });

        if (finished) testComplete();
    }

    const testComplete = () => {
        const timeElapsed = Date.now() - timeStarted;
        setFinished(true);

        
        const correct = document.querySelectorAll('.correct');
        const adjustedSpeed = (correct.length / 5) / (timeElapsed / 1000) * 60;

        const testingSpeed = (correct.length / 5) / (timeElapsed / 1000) * 60;

        const wpm = document.querySelector('.wpm');
        wpm.innerText = `WPM: ${Math.round(adjustedSpeed)}`;

        const accuracy = document.querySelector('.accuracy');
        const numCorrect = document.querySelectorAll('.correct').length;
        accuracy.innerText = `🎯 ${Math.round(numCorrect / (characterSpans.length - 1) * 100)}%`

        document.querySelector('textarea').disabled = true;
    }

    const handleRetry = () => {
        const textarea = document.querySelector('textarea');
        textarea.disabled = false;
        textarea.value = '';
        textarea.focus();
        document.querySelectorAll('.correct').forEach(char => {
            char.classList.remove('correct');
        });

        document.querySelectorAll('.incorrect').forEach(char => {
            char.classList.remove('incorrect');
        });

        document.querySelector('.retry').disabled = true;
        document.querySelector('.retry').classList.add('buttonDisabled');
        setStarted(false);
        setFinished(false);
    }

    const handleReset = async () => {
        const textarea = document.querySelector('textarea');
        textarea.disabled = false;
        textarea.value = '';
        textarea.focus();
        document.querySelectorAll('.correct').forEach(char => {
            char.classList.remove('correct');
        });

        document.querySelectorAll('.incorrect').forEach(char => {
            char.classList.remove('incorrect');
        });
        setStarted(false);
        setFinished(false);

        const response = await fetch('/api/get-words', {
            method: 'POST',
            body: JSON.stringify(numWords)
        });
        setWordBank(await response.json());

        document.querySelector('.retry').disabled = true;
        document.querySelector('.retry').classList.add('buttonDisabled');
    }

    useEffect(() => {
        document.querySelector('label#defaultNumWords').classList.add('checked');
        document.querySelector('label#defaultNumWords input').disabled = true;
        document.querySelector('.retry').disabled = true;
        document.querySelector('.retry').classList.add('buttonDisabled');
    }, []);

    useEffect(() => {
        async function fetchWords() {
            const response = await fetch('/api/get-words', {
                method: 'POST',
                body: JSON.stringify(numWords)
            });
            let wordBank;
            try {
                wordBank = await response.json();
            } catch (error) {
                if (error instanceof SyntaxError) {
                    wordBank = ['no', 'internet', 'connection', 'available', 'please', 'try', 'again'];
                }
                console.error('Error fetching wordbank:', error);

            }
            
            setWordBank(wordBank);
        }
        fetchWords();

        // Escape key grabs new words, resets test
        const handleKeyDown = (event) => {
            // numbers and ` are reserved for shortcuts, so dont allow them to be typed
            if (/^[0-9`]$/.test(event.key)) event.preventDefault();

            switch (event.code) {
                case 'Escape':
                    handleReset();
                    break;
                case 'Backquote':
                    handleRetry();
                    break;
                case 'Digit1':
                    handleRadioChange({target: {value: '10'}});
                    break;
                case 'Digit2':
                    handleRadioChange({target: {value: '25'}});
                    break;
                case 'Digit3':
                    handleRadioChange({target: {value: '50'}});
                    break;
                case 'Digit4':
                    handleRadioChange({target: {value: '100'}});
                    break;
            }
            
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [numWords])

 

    return (
        <div className='typingMain'>
            <div className='wrapper'>
                <div className='infoRow'>
                    <div className='wordNumRadioButtons'>
                        <label>
                            <input type='radio' name='numWords' onChange={handleRadioChange}></input>
                            10    
                        </label>
                        <label id='defaultNumWords'>
                            <input type='radio' name='numWords' onChange={handleRadioChange}></input>
                            25    
                        </label>
                        <label>
                            <input type='radio' name='numWords' onChange={handleRadioChange}></input>
                            50    
                        </label>
                        <label>
                            <input type='radio' name='numWords' onChange={handleRadioChange}></input>
                            100    
                        </label>
                    </div>
                    <div className='rightInfo'>
                        <div className='statistics'>
                            <p className='accuracy'>🎯 XX%</p>
                            <p className='wpm'>WPM: XX</p>
                        </div>
                        <button onClick={() => {document.querySelector('dialog').showModal()}}>?</button>
                    </div>
                </div>
                <dialog>
                    <h2>Typing...</h2>
                    <p>This is a simple typing test to measure your speed and accuracy.</p>
                    <br></br>
                    <hr></hr>
                    <br></br>
                    <h2>Keyboard Shortcuts</h2>
                    <p>Escape: Start test with new wordbank</p>
                    <p>~: Restart test with same wordbank</p>
                    <p>1: Set number of words to 10</p>
                    <p>2: Set number of words to 25</p>
                    <p>3: Set number of words to 50</p>
                    <p>4: Set number of words to 100</p>
                    <br></br>
                    <button onClick={() => {document.querySelector('dialog').close()}}>Close</button>
                </dialog>
                <hr></hr>
                <div className='wordBank'>
                    {characterSpans}
                </div>
                <textarea 
                 className='inputBox' onPaste={handlePaste} onChange={handleTyping} placeholder='Start Typing...' 
                 autoFocus autoCapitalize='none' autoCorrect='off' spellCheck='false'
                >
                </textarea>
                <button className='reset' onClick={handleReset}>Reset</button>
                <button className='retry' onClick={handleRetry}>Retry</button>
            </div>
        </div>
    )
}