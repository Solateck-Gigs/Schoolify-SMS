const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/schoolify');

const FeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: String, required: true },
  term: { type: String, required: true },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['paid', 'partially_paid', 'unpaid'], default: 'unpaid' }
}, { timestamps: true });

const Fee = mongoose.model('Fee', FeeSchema);

async function deleteEmilyFee() {
  try {
    console.log('Attempting to delete Emily\'s fee record...');
    
    // Delete the specific fee record
    const result = await Fee.deleteOne({ _id: '6854c3eaea523dc5fa51a251' });
    
    console.log('Delete result:', result);
    
    if (result.deletedCount > 0) {
      console.log('✅ Successfully deleted Emily\'s fee record');
    } else {
      console.log('❌ No fee record found with that ID');
    }
    
  } catch (error) {
    console.error('Error deleting fee:', error);
  } finally {
    mongoose.connection.close();
  }
}

deleteEmilyFee(); 