import express from 'express';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/leads - Create lead (webhook endpoint - requires API key)
router.post('/', apiKeyAuth, async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log('='.repeat(80));
    console.log('📥 LEAD SUBMISSION RECEIVED');
    console.log('Time:', new Date().toISOString());
    console.log('IP Address:', req.ip || req.connection.remoteAddress);
    console.log('User-Agent:', req.headers['user-agent'] || 'Not provided');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('='.repeat(80));

    const { name, email, phone, company, sourceWebsite, message, metadata } = req.body;

    // Validate required fields
    if (!name || !email || !sourceWebsite) {
      console.log('❌ VALIDATION FAILED: Missing required fields');
      console.log('Received:', { name: !!name, email: !!email, sourceWebsite: !!sourceWebsite });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, and sourceWebsite are required'
      });
    }

    // Validate sourceWebsite
    if (!['jungledwellers', 'safiritickets'].includes(sourceWebsite)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sourceWebsite. Must be "jungledwellers" or "safiritickets"'
      });
    }

    // Check for existing lead with same email and source
    const existingLead = await Lead.findOne({ email: email.toLowerCase(), sourceWebsite });

    if (existingLead) {
      console.log('🔄 UPDATING EXISTING LEAD:', existingLead._id);
      // Update existing lead with new information
      existingLead.name = name;
      if (phone) existingLead.phone = phone;
      if (company) existingLead.company = company;
      if (message) existingLead.message = message;
      if (metadata) existingLead.metadata = { ...existingLead.metadata, ...metadata };
      
      // Add note about update
      existingLead.notes.push({
        note: `Lead updated from ${sourceWebsite} form submission`,
        addedAt: new Date()
      });

      await existingLead.save();
      console.log('✅ LEAD UPDATED SUCCESSFULLY');
      console.log('Lead ID:', existingLead._id);
      console.log('='.repeat(80));
      return res.status(200).json({
        success: true,
        message: 'Lead updated successfully',
        lead: existingLead
      });
    }

    // Create new lead
    console.log('✨ CREATING NEW LEAD');
    const lead = new Lead({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      company: company ? company.trim() : undefined,
      sourceWebsite,
      message: message ? message.trim() : undefined,
      metadata: metadata || {},
      status: 'new'
    });

    await lead.save();
    console.log('✅ LEAD CREATED SUCCESSFULLY');
    console.log('Lead ID:', lead._id);
    console.log('Lead Name:', lead.name);
    console.log('Lead Email:', lead.email);
    console.log('Source Website:', lead.sourceWebsite);
    console.log('='.repeat(80));

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    console.error('='.repeat(80));
    console.error('❌ ERROR CREATING LEAD');
    console.error('Time:', new Date().toISOString());
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Request Body:', JSON.stringify(req.body, null, 2));
    console.error('='.repeat(80));
    res.status(500).json({
      success: false,
      error: 'Failed to create lead',
      details: error.message
    });
  }
});

// GET /api/leads - List leads (requires authentication)
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      status,
      sourceWebsite,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 15
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (sourceWebsite) {
      query.sourceWebsite = sourceWebsite;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Lead.countDocuments(query);

    // Fetch leads
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name username')
      .populate('convertedToClient', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
      details: error.message
    });
  }
});

// GET /api/leads/stats - Get lead statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || { total: 0, new: 0, contacted: 0, converted: 0, lost: 0 };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead statistics'
    });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name username')
      .populate('convertedToClient', 'name email phone company');

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead'
    });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, notes, assignedTo } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Update status if provided
    if (status && ['new', 'contacted', 'converted', 'lost'].includes(status)) {
      lead.status = status;
    }

    // Add note if provided
    if (notes && notes.note) {
      lead.notes.push({
        note: notes.note,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }

    // Update assignment if provided
    if (assignedTo !== undefined) {
      lead.assignedTo = assignedTo || null;
    }

    await lead.save();

    const updatedLead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name username')
      .populate('convertedToClient', 'name email');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead',
      details: error.message
    });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lead'
    });
  }
});

// POST /api/leads/:id/convert - Convert lead to client
router.post('/:id/convert', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    if (lead.convertedToClient) {
      return res.status(400).json({
        success: false,
        error: 'Lead has already been converted to a client'
      });
    }

    // Check if client with same email already exists
    let client = await Client.findOne({ email: lead.email });

    if (!client) {
      // Create new client from lead data
      client = new Client({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        address: lead.metadata?.address || ''
      });
      await client.save();
    }

    // Update lead
    lead.status = 'converted';
    lead.convertedToClient = client._id;
    lead.notes.push({
      note: `Converted to client by ${req.user.name || req.user.username}`,
      addedBy: req.user._id,
      addedAt: new Date()
    });
    await lead.save();

    const updatedLead = await Lead.findById(req.params.id)
      .populate('convertedToClient', 'name email phone company');

    res.json({
      success: true,
      message: 'Lead converted to client successfully',
      lead: updatedLead,
      client
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert lead to client',
      details: error.message
    });
  }
});

export default router;

