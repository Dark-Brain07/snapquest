import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Camera, PlusCircle, Coins, Search } from 'lucide-react';
import './index.css';

export const CONTRACT_ADDRESS = "0x309ccfc772dAB0611a90aD9895cBDc8619A60c68";

// Mock Quests for UI Demonstration before Contract Integration
const MOCK_QUESTS = [
  { id: 1, title: "Golden Doggo", prompt: "Take a picture of a Golden Retriever wearing sunglasses.", bounty: 50, active: true },
  { id: 2, title: "Neon Nights", prompt: "A glowing neon sign that says 'OPEN' in red.", bounty: 25, active: true },
  { id: 3, title: "Vintage Wheels", prompt: "A classic VW Beetle from the 1970s.", bounty: 100, active: false }
];

function App() {
  const { login, logout, authenticated, user } = usePrivy();
  const [view, setView] = useState<'feed' | 'create'>('feed');
  
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newBounty, setNewBounty] = useState('');

  const renderHeader = () => (
    <header className="header">
      <div>
        <h1>📸 SnapQuest</h1>
        <p style={{ fontWeight: 700, opacity: 0.8 }}>The Decentralized AI Scavenger Hunt</p>
      </div>
      <div>
        {authenticated ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="badge active">💳 {user?.wallet?.address.slice(0, 6)}...</span>
            <button className="btn btn-primary" onClick={logout}>Disconnect</button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={login}>Connect Wallet</button>
        )}
      </div>
    </header>
  );

  const renderFeed = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Active Quests</h2>
        {authenticated && (
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <PlusCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'bottom' }} /> 
            Create Quest
          </button>
        )}
      </div>

      <div className="quest-grid">
        {MOCK_QUESTS.map(quest => (
          <div key={quest.id} className="card quest-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className={`badge ${quest.active ? 'active' : 'closed'}`}>
                {quest.active ? 'Active' : 'Closed'}
              </span>
              <div className="bounty-amount">
                <Coins size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} /> 
                {quest.bounty} GEN
              </div>
            </div>
            
            <h3>{quest.title}</h3>
            <p>"{quest.prompt}"</p>
            
            {quest.active ? (
              <button className="btn btn-tertiary" style={{ width: '100%' }}>
                <Camera size={18} style={{ display: 'inline', marginRight: '8px' }} /> 
                Submit Photo
              </button>
            ) : (
              <button className="btn" disabled style={{ width: '100%', opacity: 0.5 }}>
                Quest Ended
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Create a New Quest</h2>
      
      <label style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'block' }}>Quest Title</label>
      <input 
        className="input-field" 
        placeholder="e.g. Find the Red Door"
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
      />
      
      <label style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'block' }}>Objective Prompt (For the AI Judge)</label>
      <textarea 
        className="input-field" 
        placeholder="Describe exactly what the photo must contain..."
        rows={4}
        value={newPrompt}
        onChange={e => setNewPrompt(e.target.value)}
      />
      
      <label style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'block' }}>Bounty (GEN)</label>
      <input 
        className="input-field" 
        type="number"
        placeholder="e.g. 100"
        value={newBounty}
        onChange={e => setNewBounty(e.target.value)}
      />
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-primary" style={{ flex: 1 }}>Launch Quest!</button>
        <button className="btn" onClick={() => setView('feed')}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      {renderHeader()}
      <main>
        {!authenticated ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Search size={64} color="#FFAACB" style={{ marginBottom: '2rem' }} />
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to SnapQuest</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Connect your wallet to start hunting and earning GEN!</p>
            <button className="btn btn-secondary" onClick={login} style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}>
              Start Hunting
            </button>
          </div>
        ) : (
          view === 'feed' ? renderFeed() : renderCreate()
        )}
      </main>
    </div>
  );
}

export default App;
