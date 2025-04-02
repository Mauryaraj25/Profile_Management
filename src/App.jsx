// src/App.js (React with Vite, using localStorage)
import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import './App.css';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const ProfileCard = ({ profile, onSummaryClick, onDetailsClick }) => (
  <div className="profile-card">
    <img src={profile.photo} alt={profile.name} className="profile-photo" />
    <h3>{profile.name}</h3>
    <p>{profile.description}</p>
    <div className="profile-buttons">
      <button onClick={() => onSummaryClick(profile.address)}>Summary</button>
      <button onClick={() => onDetailsClick(profile.id)}>Details</button>
    </div>
  </div>
);

const ProfileDetails = ({ profile, onClose }) => (
  <div className="profile-details">
    <h2>{profile.name} Details</h2>
    <img src={profile.photo} alt={profile.name} className="profile-photo" />
    <p>Description: {profile.description}</p>
    <p>Address: {profile.address}</p>
    <p>Contact: {profile.contact}</p>
    <p>Interests: {profile.interests}</p>
    <button onClick={onClose}>Close</button>
  </div>
);

const ProfileManager = ({ profiles, setProfiles }) => {
  const [newProfile, setNewProfile] = useState({
    name: '',
    photo: '',
    description: '',
    address: '',
    contact: '',
    interests: '',
  });
  const [editingProfileId, setEditingProfileId] = useState(null);

  const handleInputChange = (e) => {
    setNewProfile({ ...newProfile, [e.target.name]: e.target.value });
  };

  const addProfile = () => {
    if (!newProfile.name || !newProfile.address) {
      alert('Name and address are required');
      return;
    }
    if (editingProfileId) {
      setProfiles(
        profiles.map((profile) =>
          profile.id === editingProfileId ? { ...newProfile, id: editingProfileId } : profile
        )
      );
      setEditingProfileId(null);
    } else {
      setProfiles([...profiles, { ...newProfile, id: Date.now() }]);
    }
    setNewProfile({
      name: '',
      photo: '',
      description: '',
      address: '',
      contact: '',
      interests: '',
    });
  };

  const deleteProfile = (id) => {
    setProfiles(profiles.filter((profile) => profile.id !== id));
  };

  const startEdit = (profile) => {
    setEditingProfileId(profile.id);
    setNewProfile({ ...profile });
  };

  return (
    <div className="profile-manager">
      <h2>Profile Management</h2>
      <input name="name" placeholder="Name" value={newProfile.name} onChange={handleInputChange} />
      <input name="photo" placeholder="Photo URL" value={newProfile.photo} onChange={handleInputChange} />
      <input name="description" placeholder="Description" value={newProfile.description} onChange={handleInputChange} />
      <input name="address" placeholder="Address" value={newProfile.address} onChange={handleInputChange} />
      <input name="contact" placeholder="Contact" value={newProfile.contact} onChange={handleInputChange} />
      <input name="interests" placeholder="Interests" value={newProfile.interests} onChange={handleInputChange} />
      <button onClick={addProfile}>{editingProfileId ? 'Update Profile' : 'Add Profile'}</button>

      {profiles.map((profile) => (
        <div key={profile.id} className="profile-item">
          {profile.name}
          <button onClick={() => deleteProfile(profile.id)}>Delete</button>
          <button onClick={() => startEdit(profile)}>Edit</button>
        </div>
      ))}
    </div>
  );
};

function App() {
  const [profiles, setProfiles] = useState(() => {
    const storedProfiles = localStorage.getItem('profiles');
    return storedProfiles ? JSON.parse(storedProfiles) : [
      {
        id: 1,
        name: 'John Doe',
        photo: 'https://via.placeholder.com/150',
        description: 'Software Engineer',
        address: '1600 Amphitheatre Parkway, Mountain View, CA',
        contact: 'john.doe@example.com',
        interests: 'Coding, Hiking',
      },
      {
        id: 2,
        name: 'Jane Smith',
        photo: 'https://via.placeholder.com/150',
        description: 'Graphic Designer',
        address: '1 Infinite Loop, Cupertino, CA',
        contact: 'jane.smith@example.com',
        interests: 'Design, Photography',
      },
    ];
  });
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('profiles', JSON.stringify(profiles));
  }, [profiles]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const handleSummaryClick = async (address) => {
    setLoading(true);
    try {
      const latLng = await geocodeAddress(address);
      setMapCenter(latLng);
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Could not geocode address.');
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(new Error('Geocoding failed'));
        }
      });
    });
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadError) return <div>Error loading Google Maps.</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <ProfileManager profiles={profiles} setProfiles={setProfiles} />
      <h2>Profiles</h2>
      <input type="text" placeholder="Search profiles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      <div className="profile-map-container">
        <div className="profile-list">
          {filteredProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} onSummaryClick={handleSummaryClick} onDetailsClick={() => setSelectedProfileId(profile.id)} />
          ))}
        </div>
        <div className="map-details">
          {loading && <div className="loading-indicator">Loading...</div>}
          {mapCenter && (
            <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={15}>
              <Marker position={mapCenter} />
            </GoogleMap>
          )}
          {selectedProfileId && (
            <ProfileDetails profile={profiles.find((p) => p.id === selectedProfileId)} onClose={() => setSelectedProfileId(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;