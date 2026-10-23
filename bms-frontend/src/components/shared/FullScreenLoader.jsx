const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning Circle */}
        <div className="w-16 h-16 border-4 border-[#f74565] border-t-transparent rounded-full animate-spin" />

        {/* Label */}
        <p className="text-lg font-semibold text-[#f74565] animate-pulse">
          Warming up the projector...
        </p>
      </div>
    </div>
  );
};

export default FullScreenLoader;