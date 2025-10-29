import logoImage from '../assets/logo.png';

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-white">
      <img
        src={logoImage}
        alt="Logo"
        className="w-64 h-auto mb-8"
        style={{ filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))' }}
      />
      <h1 className="text-7xl font-bold tracking-tight">
        Welcome
      </h1>
      <p className="mt-4 text-lg text-slate-400">
        Select an option from the sidebar to get started.
      </p>
    </div>
  );
}

export default HomePage;