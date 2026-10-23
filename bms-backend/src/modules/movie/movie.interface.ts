export interface IMovie {
    _id?: string;
    title: string;
    description: string;
    duration: string;
    genre: string[];
    releaseDate: Date;
    languages: string[];
    certification: string;
    posterUrl: string;
    rating: number;
    votes: number;
    format?: string[];
}