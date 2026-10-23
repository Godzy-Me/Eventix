import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { MdChair } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { getBookingById } from "../apis";
import { groupSeatsByType } from "../utils";

const BookingConfirmation = () => {
  const { bookingId } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId),
    select: (res) => res.data.booking,
    // the webhook may still be confirming for a second - poll while pending
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 2000 : false),
  });

  if (isLoading) {
    return <div className="py-24 text-center text-gray-500">Loading your ticket...</div>;
  }

  if (isError || !data) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-500 mb-4">We could not find this booking.</p>
        <Link to="/profile" className="text-[#f74565] underline">Go to your orders</Link>
      </div>
    );
  }

  const { show } = data;
  const confirmed = data.status === "CONFIRMED";

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <FaCheckCircle className={`mx-auto mb-3 ${confirmed ? "text-green-500" : "text-yellow-500"}`} size={56} />
          <h1 className="text-2xl font-bold">
            {confirmed ? "Booking confirmed!" : data.status === "PENDING" ? "Confirming your payment..." : `Booking ${data.status.toLowerCase()}`}
          </h1>
          {confirmed && <p className="text-gray-500 mt-1">A great show awaits. Show this ticket at the cinema.</p>}
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex gap-5 p-6">
            <img src={show?.movie?.posterUrl} alt={show?.movie?.title} className="w-24 h-36 object-cover rounded" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{show?.movie?.title}</h2>
              <p className="text-sm text-gray-500">
                {show?.movie?.certification} | {show?.format} | {(show?.movie?.languages || []).join(", ")}
              </p>
              <p className="text-sm font-semibold text-gray-700 mt-3">
                {dayjs(show?.date, "DD-MM-YYYY").format("ddd, DD MMM YYYY")} | {show?.startTime}
              </p>
              <p className="text-sm text-gray-600">
                {show?.theater?.name}, {show?.theater?.city}
              </p>
              <div className="mt-3 text-sm font-semibold text-gray-700">
                <MdChair className="inline mr-2" size={20} />
                {groupSeatsByType(data.seats).map(({ type, seats }) => (
                  <span key={type} className="mr-3">{type}: {seats.join(", ")}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 mx-6" />

          <div className="p-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Booking ID</p>
              <p className="font-bold text-lg tracking-widest">{data.bookingCode}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Amount paid</p>
              <p className="font-bold text-lg">₹{data.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Tickets</p>
              <p className="font-medium">{data.seats.length}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Payment</p>
              <p className="font-medium capitalize">{data.payment?.method || data.payment?.provider || "—"}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Link to="/profile" state={{ tab: "Your Orders" }} className="bg-black text-white px-6 py-2 rounded-lg font-medium">
            View all orders
          </Link>
          <Link to="/" className="border border-gray-300 bg-white px-6 py-2 rounded-lg font-medium">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
