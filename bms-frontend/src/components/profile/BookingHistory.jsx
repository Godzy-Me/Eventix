import React from 'react'
import { ordersData } from "../../utils/constants";
import { MdChair } from "react-icons/md"

const BookingHistory = () => {
    return (
        <>
            <div className="px-6 rounded-md">
                <h3 className="text-xl font-semibold mb-4">Your Orders</h3>

                {ordersData.map((order) => (
                    <>
                        <div
                            key={order.id}
                            className="bg-white p-5 rounded-md mb-2 overflow-hidden"
                        >
                            <div className="flex items-start gap-10">
                                <img
                                    src={order.poster}
                                    alt=""
                                    className="w-30 h-40 object-cover rounded"
                                />

                                {/* Divider with fixed height same as image */}
                                <div className="h-40 border-l border-gray-300 border-dashed"></div>

                                <div className="flex items-start justify-between w-full">
                                    <div className="flex-1">
                                        <p className="font-normal text-lg">{order.title}</p>

                                        <p className="text-sm text-gray-500">{order.format}</p>

                                        <p className="text-sm font-semibold text-gray-700 mt-2">
                                            {order.datetime} - {order.cinema}
                                        </p>

                                        <small className="text-gray-700 mt-1">
                                            Quantity: {order.quantity}
                                        </small>

                                        <p className="text-md font-semibold text-gray-700 mt-2">
                                            <MdChair className="inline items-center mr-2" size={24} />
                                            {order.seats}
                                        </p>
                                    </div>

                                    <p>M-Ticket</p>


                                </div>
                            </div>
                            <div className="p-4 text-right">
                                <p className="text-sm text-gray-500">
                                    Ticket: ₹{order.ticket.toFixed(2)}
                                    <br />
                                    Convenience Fees: ₹{order.fee.toFixed(2)}
                                </p>
                                <p className="text-xl font-bold">₹{order.total.toFixed(2)}</p>
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-8">
                                <div>
                                    <p className="font-semibold">Booking Date & Time</p>
                                    <p>{order.bookingTime}</p>
                                </div>

                                <div>
                                    <p className="font-semibold">Payment Method</p>
                                    <p>{order.paymentMethod}</p>
                                </div>

                                <div>
                                    <p className="font-semibold">Booking ID</p>
                                    <p>{order.id}</p>
                                </div>
                            </div>

                        </div>
                    </>
                ))}
            </div>
        </>
    )
}

export default BookingHistory