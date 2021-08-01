import { FC, useState, useEffect, useCallback, useRef } from "react";
import { useLazyQuery } from "@apollo/client";
import {
  GetTracks,
  GetTracks_tracks,
} from "../../components/__generated__/GetTracks";
import useTimer from "../../hooks/useTimer";
import { useSong } from "../../contexts/SongContext";
import GamePageView from "./GamePageView";
import GET_TRACKS from "./query";

const GamePageLogic: FC = () => {
  const score = useRef<number>(0);
  const chosenSong = useRef<GetTracks_tracks>();
  const cacheTracks = useRef<GetTracks_tracks[]>([]);
  const showSongInformation = useRef<boolean>(false);
  const [openingCountdownOver, setOpeningCountdownOver] = useState<boolean>(
    false
  );
  const totalRounds = useRef<number>(10);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [rounds, setRounds] = useState(totalRounds.current);
  const [currentTracks, setCurrentTracks] = useState<GetTracks_tracks[]>([]);
  const [countdownOver, setCountdownOver] = useState<boolean>(false);
  const [getTracks, { data }] = useLazyQuery<GetTracks>(GET_TRACKS);
  const { setCurrentSong } = useSong();
  const [timeRemaining, startTimer, endFunc, resetTimer] = useTimer(10);

  const closeOpeningCountdown = () => setOpeningCountdownOver(true);
  const countdownIsOver = () => setCountdownOver(true);

  /**
   * Function that takes in the clicked on songs name, and updates score based on if it matches the chosen songs name.
   * In addition, the function substracts four from our current tracks and selects the new tracks
   */
  const verifySong = useCallback((songName: string = "") => {
    if (songName === chosenSong.current?.name) score.current += 100;
    else score.current -= 100;
    const newTracks = cacheTracks.current.slice(4);
    cacheTracks.current = newTracks;
    setCurrentTracks((tracks) => tracks.splice(4)); // Update our track state here
    showSongInformation.current = true;
  }, []);

  const setupSong = useCallback(() => {
    console.log("in set up song");
    showSongInformation.current = false;
    const randomSong = cacheTracks.current[Math.floor(Math.random() * 4)];
    chosenSong.current = randomSong;
    setCurrentSong(randomSong.preview_url);
    resetTimer();
  }, [resetTimer, setCurrentSong]);

  /**  Problem: When we run out of time, the setupsong is run from two different places due to race condition
  this is in the useeffect above and in the useTimer hook logic. We either need to create a new function which is triggered
  from the time running out in the hook */

  // Sets and adds the spotify data to our cacheTracks
  useEffect(() => {
    console.log("in first");
    if (data?.tracks) {
      cacheTracks.current = [...cacheTracks.current, ...data.tracks];
      setCurrentTracks(cacheTracks.current);
    }
  }, [data?.tracks]);

  // Gets the tracks after the countdown finishes
  useEffect(() => {
    console.log("in second");
    if (endFunc.current.toString() === "() => {}") endFunc.current = setupSong; // Setup function to be in the userTimer hook
    if (openingCountdownOver) {
      // Check to see if our cacheTracks is smaller than the amount we specified, if it is get more tracks
      if (currentTracks.length < totalRounds.current * 4) getTracks();
      else {
        console.log("finished collecting tracks");
        setGameStarted(true);
      }
    }
  }, [
    currentTracks.length,
    endFunc,
    getTracks,
    openingCountdownOver,
    setupSong,
  ]);

  // Logic that occurs when a round ends, either from button click or the timer running out
  useEffect(() => {
    console.log("in third");
    if (gameStarted) {
      if (rounds === 0) alert("done"); //TODO: Implement this
      // setTimeout for 3 seconds to display time info
      if (rounds === totalRounds.current) setupSong();
      // The else below only occurs on the first song
      else setTimeout(() => setupSong(), 3000);
    }
  }, [rounds, setupSong, gameStarted]);

  return (
    <GamePageView
      chosenSong={chosenSong}
      closeOpeningCountdown={closeOpeningCountdown}
      countdownOver={countdownOver}
      countdownIsOver={countdownIsOver}
      score={score}
      showSongInformation={showSongInformation}
      songs={[
        currentTracks[0],
        currentTracks[1],
        currentTracks[2],
        currentTracks[3],
      ]}
      verifySong={verifySong}
      currentTracks={currentTracks}
      openingCountdownOver={openingCountdownOver}
      rounds={rounds}
      timeRemaining={timeRemaining}
      setRounds={setRounds}
    />
  );
};

export default GamePageLogic;
