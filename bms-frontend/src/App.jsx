
function App() {

  return (
    <>
      <div>
        <main>
          <Routes>
            {                }
            <Route path="/" element={<h1>Home Page</h1>} />
            <Route path="/profile/:id" element={<h1>Profile Page</h1>} /> 
            <Route path="/movies" element={<h1>Movies Page</h1>} />
          </Routes>
        </main>
      </div>
    </>
  )
}

export default App
