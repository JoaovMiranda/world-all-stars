import { BjjCareerMethodology } from './methodologies/bjj-career/bjj-career.methodology';
import { BoxingMethodology } from './methodologies/boxing/boxing.methodology';
import { ChessClassicalMethodology } from './methodologies/chess-classical/chess-classical.methodology';
import { FootballChampionsMethodology } from './methodologies/football-champions/football-champions.methodology';
import { IronmanMethodology } from './methodologies/ironman/ironman.methodology';
import { OlympicMedalsMethodology } from './methodologies/olympic-medals/olympic-medals.methodology';

/** Football World Champions V1 (stateless singleton). */
export const footballChampions = new FootballChampionsMethodology();

/** Jiu-Jitsu Career Ranking V1 (stateless singleton). */
export const bjjCareer = new BjjCareerMethodology();

/** Boxing career ranking V1 (stateless singleton). */
export const boxing = new BoxingMethodology();

/** Olympic medals ranking V1 (stateless singleton). */
export const olympicMedals = new OlympicMedalsMethodology();

/** Chess ranking V1 (stateless singleton). */
export const chessClassical = new ChessClassicalMethodology();

/** Ironman ranking V1 (stateless singleton). */
export const ironman = new IronmanMethodology();
