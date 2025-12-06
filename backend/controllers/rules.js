const rulesModel = require("../model/rules")

const createRules = async(req,res) => {
    try {
        const rule = new rulesModel(req.body);
        await rule.save();

        res.status(201).json({
            message:"Rule created sucessfully",
            rule
        })
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

const getAllRules = async(req,res) => {
    try {
        const rules = await rulesModel.find().sort({priority:-1});
        res.status(200).json({message:"Rules retrieved successfully",rules})
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}

const getRulesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const rules = await rulesModel.find({ category }).sort({ priority: -1 });

    if (!rules.length) {
      return res.status(404).json({ message: "No rules found for this category" });
    }

    res.status(200).json({
      message: "Rules fetched successfully",
      rules,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await rulesModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    res.status(200).json({
      message: "Rule updated successfully",
      rule,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await Rule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    res.status(200).json({
      message: "Rule deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {createRules,getAllRules,getRulesByCategory,updateRule,deleteRule}