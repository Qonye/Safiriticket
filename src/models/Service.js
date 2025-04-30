import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g. hotel, flight, transfer, etc.
  description: String,
  fields: [ // dynamic fields for this service type
    {
      key: String,         // e.g. "hotelName", "airline"
      label: String,       // e.g. "Hotel Name", "Airline"
      inputType: String,   // e.g. "text", "date", "number"
      required: Boolean
    }
  ],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model('Service', serviceSchema);

// The previous comment block was just an example of a service document structure for reference.
// The actual schema above is what is used by Mongoose and your application.
