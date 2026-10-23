import { IShow, ISeatRow } from './show.interface';
import { generateSeatLayout } from '../../utils';
import { ShowModel } from './show.model';
import { Types } from 'mongoose';
import { groupShowsByTheatreAndMovie } from '../../utils';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 1. create a show 
export const createShow = async(showData: IShow) => {  
    const seatLayout = generateSeatLayout();  
    const showsToCreate = {...showData, seatLayout};

    return await ShowModel.create(showsToCreate)
}


// 2. get shows by movie data and location 
export const getShowsByMovieDateLocation = async(movieId: string, date: string, location: string) => {
    const query: any = {
        movie: new Types.ObjectId(movieId),
        location: {$regex: new RegExp(escapeRegex(location || ""),'i')},

    }
    if(date){
        query.date = date;
    }

    const shows = await ShowModel.find(query).populate("movie theater").sort({startTime: 1});

    const groupedShows = groupShowsByTheatreAndMovie(shows);

    return groupedShows;
}


//3. get show by id 

export const getShowById = async(showId: string) => {
    return await ShowModel.findById(showId).populate("movie theater");
}

//4. update seat status (admin only)
export const updatedSeatStatus = async(showid: string, row: string, seatNumber: number,status
: "AVAILABLE" | "BOOKED" | "BLOCKED") => {
    return await ShowModel.updateOne(
        { _id: new Types.ObjectId(showid), "seatLayout.row": row },
        { 
            $set: { "seatLayout.$.seats.$[elem].status": status,

         }, 
        },
        {
            arrayFilters: [{ "elem.number": seatNumber}],

        }
        
    );
};

// ---------------------------------------------------------------------------
// Booking helpers
// ---------------------------------------------------------------------------

export interface ResolvedSeat {
    seatId: string;
    row: string;
    number: number;
    type: string;
    price: number;
    status: string;
}

export const SEAT_ID_REGEX = /^([A-Z]+)(\d+)$/;

export const parseSeatId = (seatId: string) => {
    const m = SEAT_ID_REGEX.exec(seatId);
    if (!m) return null;
    return { row: m[1], number: Number(m[2]) };
};

/**
 * Turn ["A1","E3"] into full seat info using the show's own layout.
 * Prices ALWAYS come from the DB - never from the client.
 * Returns null if any seat id does not exist in the layout.
 */
export const resolveSeats = (seatLayout: ISeatRow[], seatIds: string[]): ResolvedSeat[] | null => {
    const out: ResolvedSeat[] = [];
    for (const seatId of seatIds) {
        const parsed = parseSeatId(seatId);
        if (!parsed) return null;
        const row = seatLayout.find((r) => r.row === parsed.row);
        const seat = row?.seats.find((s) => s.number === parsed.number);
        if (!row || !seat) return null;
        out.push({
            seatId,
            row: row.row,
            number: seat.number,
            type: row.type,
            price: row.price,
            status: seat.status,
        });
    }
    return out;
};

/**
 * Atomically flip a group of seats AVAILABLE -> BOOKED in a single document update.
 * The filter requires EVERY seat to still be AVAILABLE, so it is all-or-nothing and safe
 * against concurrent bookings without needing a Mongo transaction (replica set).
 * Returns true if the seats were booked, false if any of them was already taken.
 */
export const bookSeatsAtomically = async (showId: string, seatIds: string[]): Promise<boolean> => {
    const parsed = seatIds.map((s) => parseSeatId(s));
    if (parsed.some((p) => !p)) return false;
    const seats = parsed as { row: string; number: number }[];

    const filter: any = {
        _id: new Types.ObjectId(showId),
        $and: seats.map((s) => ({
            seatLayout: {
                $elemMatch: {
                    row: s.row,
                    seats: { $elemMatch: { number: s.number, status: "AVAILABLE" } },
                },
            },
        })),
    };

    // Pipeline-style update: rebuild seatLayout in one expression, flipping only the chosen seats.
    // (A single-document update is atomic in MongoDB, and the filter above guarantees every
    //  seat was still AVAILABLE at the instant of the write.)
    const update = [
        {
            $set: {
                seatLayout: {
                    $map: {
                        input: "$seatLayout",
                        as: "r",
                        in: {
                            $mergeObjects: [
                                "$$r",
                                {
                                    seats: {
                                        $map: {
                                            input: "$$r.seats",
                                            as: "s",
                                            in: {
                                                $cond: [
                                                    { $in: [{ $concat: ["$$r.row", { $toString: "$$s.number" }] }, { $literal: seatIds }] },
                                                    { $mergeObjects: ["$$s", { status: "BOOKED" }] },
                                                    "$$s",
                                                ],
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
    ];

    const res = await ShowModel.updateOne(filter, update as any);
    return res.modifiedCount === 1;
};

/** Revert seats to AVAILABLE (used if a booking has to be rolled back). */
export const releaseSeatsInDb = async (showId: string, seatIds: string[]) => {
    for (const id of seatIds) {
        const p = parseSeatId(id);
        if (p) await updatedSeatStatus(showId, p.row, p.number, "AVAILABLE");
    }
};
