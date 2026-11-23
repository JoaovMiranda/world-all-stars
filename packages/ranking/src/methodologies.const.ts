import { BjjCareerMethodology } from './methodologies/bjj-career/bjj-career.methodology';
import { FootballChampionsMethodology } from './methodologies/football-champions/football-champions.methodology';

/** Football World Champions V1 (stateless singleton). */
export const footballChampions = new FootballChampionsMethodology();

/** Jiu-Jitsu Career Ranking V1 (stateless singleton). */
export const bjjCareer = new BjjCareerMethodology();
