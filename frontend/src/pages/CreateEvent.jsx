import React, { useState } from "react";
import Accordion from "../components/Accordion";
import ListManager from "../components/ListManager";
import FooterComp from "../components/Footer";

const CreateEvent = () => {
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    date: "",
    venue: "",
    members: "",
    rulebookLink: "",
    accounts: "",
    description: "",
    coordinators: [],
    usefulLinks: [],
  });

  const handleSaveEvent = () => {
    setEventDetails(prev => ({
      ...prev, 
    }));
    // console.log("Event Details:", eventDetails);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSection = (section) => {
    console.log(`Saved ${section}:`, eventDetails[section]);
  };

  return (
    <div>

      <div className="flex flex-wrap justify-between items-center px-5 py-4 md:px-10">
        <h1 className="text-white font-bold text-2xl pl-5 md:pl-10">Create Event</h1>
        <div className="flex space-x-3 md:space-x-4 pr-5 md:pr-10">
          <button
            onClick={handleSaveEvent} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 md:px-6 md:py-3 rounded-md"
          >
            Save
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 md:px-6 md:py-3 rounded-md">
            Make Live
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex justify-center items-center min-h-screen p-3 md:p-5">
        <div className="p-4 md:p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <Accordion title="Basic Details" onSave={() => handleSaveSection("eventName")}>
            <input
              type="text"
              name="eventName"
              placeholder="Event Name"
              value={eventDetails.eventName}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 text-white rounded mb-2"
            />
            <input
              type="date"
              name="date"
              value={eventDetails.date}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 text-white rounded mb-2"
            />
            <input
              type="text"
              name="venue"
              placeholder="Venue"
              value={eventDetails.venue}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 text-white rounded mb-2"
            />
            <input
              type="number"
              name="members"
              placeholder="No of Members"
              value={eventDetails.members}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 text-white rounded mb-2"
            />
            <input type="file" className="w-full p-2 bg-gray-700 text-white rounded" />
          </Accordion>

          <Accordion title="Description" onSave={() => handleSaveSection("description")}>
            <textarea
              name="description"
              value={eventDetails.description}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
              placeholder="Event Description"
            />
          </Accordion>

          <Accordion title="Rulebook" onSave={() => handleSaveSection("rulebookLink")}>
            <input
              type="text"
              name="rulebookLink"
              placeholder="Rulebook Link"
              value={eventDetails.rulebookLink}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
            />
          </Accordion>

          <Accordion title="Registration Fee" onSave={() => handleSaveSection("accounts")}>
            <input
              type="text"
              name="accounts"
              placeholder="Accounts"
              value={eventDetails.accounts}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 text-white rounded mb-2"
            />
            <input type="file" className="w-full p-2 bg-gray-700 text-white rounded" />
          </Accordion>

          <Accordion title="Coordinators" onSave={() => handleSaveSection("coordinators")}>
            <ListManager
              items={eventDetails.coordinators}
              setItems={(newList) => setEventDetails((prev) => ({ ...prev, coordinators: newList }))}
              placeholder1="Name"
              placeholder2="Mobile Number"
            />
          </Accordion>

          <Accordion title="Useful Links" onSave={() => handleSaveSection("usefulLinks")}>
            <ListManager
              items={eventDetails.usefulLinks}
              setItems={(newList) => setEventDetails((prev) => ({ ...prev, usefulLinks: newList }))}
              placeholder1="Title"
              placeholder2="Link"
            />
          </Accordion>
        </div>
      </div>

      <FooterComp />
    </div>
  );
};

export default CreateEvent;
