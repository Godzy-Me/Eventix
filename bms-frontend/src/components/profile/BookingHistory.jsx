import React from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { MdChair } from "react-icons/md"
import { getMyBookings } from '../../apis'
import { groupSeatsByType } from '../../utils'

const BookingHistory = () => {
    const { data: bookings, isLoading, isError } = useQuery({
        queryKey: ['myBookings'],
        queryFn: getMyBookings,
        select: (res) => res.data.bookings,
    });

    if (isLoading) return <p className="px-6 text-gray-500">Loading your orders...</p>;
    if (isError) return <p className="px-6 text-red-500">Could not load your orders.</p>;

    if (!bookings?.length) {
        return (
            <div className="px-6">
                <h3 className="text-xl font-semibold mb-4">Your Orders</h3>
                <div className="bg-white p-10 rounded-md text-center text-gray-500">
                    You have no bookings yet.{" "}
                    <Link to="/movies" className="text-[#f74565] underline">Book a movie</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="px-6 rounded-md">
                <h3 className="text-xl font-semibold mb-4">Your Orders</h3>

                {bookings.map((order) => {
                    const show = order.show;
                    return (
                        <div
                            key={order._id}
                            className="bg-white p-5 rounded-md mb-2 overflow-hidden"
                        >
                            <div className="flex items-start gap-10">
                                <img
                                    src={show?.movie?.posterUrl}
                                    alt=""
                                    className="w-30 h-40 object-cover rounded"
                                />

                                {/* Divider with fixed height same as image */}
                                <div className="h-40 border-l border-gray-300 border-dashed"></div>

                                <div className="flex items-start justify-between w-full">
                                    <div className="flex-1">
                                        <p className="font-normal text-lg">{show?.movie?.title}</p>

                                        <p className="text-sm text-gray-500">{show?.format}</p>

                                        <p className="text-sm font-semibold text-gray-700 mt-2">
                                            {dayjs(show?.date, "DD-MM-YYYY").format("ddd, DD MMM YYYY")} | {show?.startTime} - {show?.theater?.name}, {show?.theater?.city}
                                        </p>

                                        <small className="text-gray-700 mt-1">
                                            Quantity: {order.seats.length}
                                        </small>

                                        <p className="text-md font-semibold text-gray-700 mt-2">
                                            <MdChair className="inline items-center mr-2" size={24} />
                                            {groupSeatsByType(order.seats).map(({ type, seats }) => (
                                                <span key={type} className="mr-3">{type}: {seats.join(", ")}</span>
                                            ))}
                                        </p>
                                    </div>

                                    <Link to={`/booking/${order._id}/confirmation`} className="text-[#f74565] text-sm font-medium">
                                        M-Ticket
                                    </Link>
                                </div>
                            </div>
                            <div className="p-4 text-right">
                                <p className="text-sm text-gray-500">
                                    Ticket: ₹{order.baseAmount.toFixed(2)}
                                    <br />
                                    Convenience Fees: ₹{order.taxAmount.toFixed(2)}
                                </p>
                                <p className="text-xl font-bold">₹{order.totalAmount.toFixed(2)}</p>
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-8">
                                <div>
                                    <p className="font-semibold">Booking Date & Time</p>
                                    <p>{dayjs(order.createdAt).format("MMM DD YYYY hh:mmA")}</p>
                                </div>

                                <div>
                                    <p className="font-semibold">Payment Method</p>
                                    <p className="capitalize">{order.payment?.method || order.payment?.provider || "—"}</p>
                                </div>

                                <div>
                                    <p className="font-semibold">Booking ID</p>
                                    <p>{order.bookingCode}</p>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
        </>
    )
}

export default BookingHistory
