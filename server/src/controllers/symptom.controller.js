import Symptom from "../models/Symptom.js";

export const createSymptom = async (req, res) => {
  try {
    const symptomData = {
      ...req.body,
      userId: req.user.id,
    };

    const symptom = await Symptom.create(symptomData);
    res.status(201).json(symptom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET — All symptoms
export const getSymptoms = async (req, res) => {
  try {
    const symptoms = await Symptom.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(symptoms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET — Single symptom
export const getSymptom = async (req, res) => {
  try {
    const symptom = await Symptom.findOne({ _id: req.params.id, userId: req.user.id });
    if (!symptom) {
      return res.status(404).json({ error: "Symptom not found or unauthorized" });
    }
    res.json(symptom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT — Update status or fields
export const updateSymptom = async (req, res) => {
  try {
    const updated = await Symptom.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Symptom not found or unauthorized" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE — Remove symptom
export const deleteSymptom = async (req, res) => {
  try {
    const deleted = await Symptom.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ error: "Symptom not found or unauthorized" });
    }
    res.json({ message: "Symptom deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET — Progress
export const getProgress = async (req, res) => {
  try {
    const symptoms = await Symptom.find({ userId: req.user.id });

    const grouped = {};
    symptoms.forEach(sym => {
      if (!grouped[sym.symptomName]) {
        grouped[sym.symptomName] = [];
      }
      grouped[sym.symptomName].push({
        date: sym.date,
        severity: sym.severity
      });
    });

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};