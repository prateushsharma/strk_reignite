// ======================================================================
// COMPREHENSIVE TOOL AND AGENT DEFINITION VALIDATOR
// ======================================================================
// This program performs in-depth validation of Python-based tool and agent
// definitions to ensure compliance with the Lynq framework specifications.
// It checks for required fields, proper syntax, and best practices.

using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;

namespace LynqDefinitionValidator
{
    // ==================================================================
    // MAIN PROGRAM CLASS
    // ==================================================================
    class Program
    {
        // Configuration constants for validation parameters
        private const int MAX_TOOL_NAME_LENGTH = 50;
        private const int MIN_DESCRIPTION_LENGTH = 20;
        private const int MAX_DESCRIPTION_LENGTH = 500;
        private const string REQUIRED_TOOL_FIELDS = "name|description|params|returns|type";
        private const string REQUIRED_AGENT_FIELDS = "name|description|backstory|goal|tool_access|agent_access";

        // ==============================================================
        // MAIN ENTRY POINT
        // ==============================================================
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            PrintBanner();
            
            try
            {
                // Validate and process input arguments
                string baseDir = ProcessArguments(args);
                
                // Initialize validation statistics
                var stats = new ValidationStatistics();
                
                // Discover and process all Python files
                ProcessPythonFiles(baseDir, stats);
                
                // Generate final validation report
                GenerateValidationReport(stats);
            }
            catch (Exception ex)
            {
                LogError($"Fatal validation error: {ex.Message}", ex);
                Environment.Exit(1);
            }
        }

        // ==============================================================
        // ARGUMENT PROCESSING
        // ==============================================================
        private static string ProcessArguments(string[] args)
        {
            Console.WriteLine("🔧 Processing command line arguments...");
            
            string baseDir;
            if (args.Length > 0)
            {
                baseDir = args[0];
                Console.WriteLine($"📁 Using specified directory: {baseDir}");
                
                if (!Directory.Exists(baseDir))
                {
                    throw new DirectoryNotFoundException($"The specified directory does not exist: {baseDir}");
                }
            }
            else
            {
                baseDir = Directory.GetCurrentDirectory();
                Console.WriteLine($"📁 Using current working directory: {baseDir}");
            }
            
            Console.WriteLine("✅ Argument processing complete.\n");
            return baseDir;
        }

        // ==============================================================
        // PYTHON FILE PROCESSING
        // ==============================================================
        private static void ProcessPythonFiles(string baseDir, ValidationStatistics stats)
        {
            Console.WriteLine("🔍 Scanning for Python files...");
            
            // Recursively find all Python files in directory tree
            string[] files = Directory.GetFiles(
                baseDir, 
                "*.py", 
                SearchOption.AllDirectories
            );
            
            Console.WriteLine($"📚 Found {files.Length} Python files to analyze");

            foreach (var file in files)
            {
                stats.TotalFilesProcessed++;
                Console.WriteLine($"\n📄 Processing file {stats.TotalFilesProcessed}/{files.Length}: {Path.GetFileName(file)}");
                
                try
                {
                    string content = File.ReadAllText(file);
                    bool hasTools = content.Contains("@Tool.register");
                    bool hasAgents = content.Contains("@Agent.register");

                    if (hasTools)
                    {
                        Console.WriteLine("🛠️  Found tool definitions - validating...");
                        ValidateTools(content, file, stats);
                    }

                    if (hasAgents)
                    {
                        Console.WriteLine("🤖 Found agent definitions - validating...");
                        ValidateAgents(content, file, stats);
                    }

                    if (!hasTools && !hasAgents)
                    {
                        Console.WriteLine("ℹ️  No tool or agent definitions found in this file");
                    }
                }
                catch (Exception ex)
                {
                    LogError($"Error processing file {file}: {ex.Message}", ex);
                    stats.FilesWithErrors++;
                }
            }
        }

        // ==============================================================
        // TOOL VALIDATION
        // ==============================================================
        private static void ValidateTools(string code, string filePath, ValidationStatistics stats)
        {
            // Enhanced regex pattern to capture entire tool definition blocks
            var toolRegex = new Regex(
                @"@Tool\.register\(\s*{(.*?)}\s*\)\s*\n.*?async def (\w+)\((.*?)\)",
                RegexOptions.Singleline
            );

            foreach (Match match in toolRegex.Matches(code))
            {
                stats.TotalToolsFound++;
                string toolName = match.Groups[2].Value;
                Console.WriteLine($"\n🛠️  Validating tool: {toolName}");
                
                try
                {
                    string jsonBlock = match.Groups[1].Value;
                    string functionDef = match.Groups[0].Value;

                    // Step 1: Validate JSON structure
                    ValidateToolJson(jsonBlock, toolName, filePath, stats);
                    
                    // Step 2: Validate function signature
                    ValidateToolFunction(functionDef, toolName, filePath, stats);
                    
                    // Step 3: Check for docstring
                    ValidateToolDocstring(code, toolName, match.Index, stats);
                    
                    stats.ValidTools++;
                }
                catch (ValidationException vex)
                {
                    Console.WriteLine($"❌ Tool validation failed for {toolName}: {vex.Message}");
                    stats.InvalidTools++;
                }
                catch (Exception ex)
                {
                    LogError($"Unexpected error validating tool {toolName}: {ex.Message}", ex);
                    stats.InvalidTools++;
                }
            }
        }

        private static void ValidateToolJson(string jsonBlock, string toolName, string filePath, ValidationStatistics stats)
        {
            // Normalize JSON by removing Python comments and fixing potential issues
            string cleanJson = Regex.Replace(jsonBlock, @"#.*?$", "", RegexOptions.Multiline);
            cleanJson = cleanJson.Replace("'", "\"").Replace("None", "null").Replace("True", "true").Replace("False", "false");

            try
            {
                // Parse JSON into dictionary for validation
                var jsonDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                    "{" + cleanJson + "}"
                );

                if (jsonDict == null)
                {
                    throw new ValidationException("Invalid JSON structure in tool registration");
                }

                // Check for required fields
                foreach (string field in REQUIRED_TOOL_FIELDS.Split('|'))
                {
                    if (!jsonDict.ContainsKey(field))
                    {
                        throw new ValidationException($"Missing required field: {field}");
                    }
                }

                // Validate field contents
                ValidateToolField(jsonDict, "name", MAX_TOOL_NAME_LENGTH);
                ValidateToolField(jsonDict, "description", MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH);

                // Validate parameters structure
                if (jsonDict.TryGetValue("params", out JsonElement paramsElement))
                {
                    ValidateParameters(paramsElement, toolName);
                }

                Console.WriteLine("✅ Tool JSON validation passed");
            }
            catch (JsonException jex)
            {
                throw new ValidationException($"Invalid JSON format: {jex.Message}");
            }
        }

        private static void ValidateToolField(Dictionary<string, JsonElement> jsonDict, string fieldName, 
                                            int maxLength, int minLength = 1)
        {
            if (jsonDict.TryGetValue(fieldName, out JsonElement fieldValue))
            {
                string value = fieldValue.ToString();
                if (string.IsNullOrWhiteSpace(value))
                {
                    throw new ValidationException($"{fieldName} cannot be empty");
                }
                if (value.Length > maxLength)
                {
                    throw new ValidationException($"{fieldName} exceeds maximum length of {maxLength} characters");
                }
                if (value.Length < minLength)
                {
                    throw new ValidationException($"{fieldName} must be at least {minLength} characters");
                }
            }
        }

        // ==============================================================
        // AGENT VALIDATION
        // ==============================================================
        private static void ValidateAgents(string code, string filePath, ValidationStatistics stats)
        {
            // Comprehensive regex to capture agent registration blocks
            var agentRegex = new Regex(
                @"@Agent\.register\(\s*([^)]+)\s*\)\s*\nclass (\w+)",
                RegexOptions.Singleline
            );

            foreach (Match match in agentRegex.Matches(code))
            {
                stats.TotalAgentsFound++;
                string agentName = match.Groups[2].Value;
                Console.WriteLine($"\n🤖 Validating agent: {agentName}");
                
                try
                {
                    string registrationArgs = match.Groups[1].Value;
                    
                    // Validate registration arguments
                    ValidateAgentRegistration(registrationArgs, agentName, stats);
                    
                    // Validate class definition
                    ValidateAgentClass(code, match.Index, agentName, stats);
                    
                    stats.ValidAgents++;
                }
                catch (ValidationException vex)
                {
                    Console.WriteLine($"❌ Agent validation failed for {agentName}: {vex.Message}");
                    stats.InvalidAgents++;
                }
                catch (Exception ex)
                {
                    LogError($"Unexpected error validating agent {agentName}: {ex.Message}", ex);
                    stats.InvalidAgents++;
                }
            }
        }

        private static void ValidateAgentRegistration(string registrationArgs, string agentName, ValidationStatistics stats)
        {
            // Convert registration arguments to JSON-like format for parsing
            string pseudoJson = registrationArgs
                .Replace("\n", "")
                .Replace("\r", "")
                .Replace("=", ":")
                .Replace("None", "null")
                .Replace("True", "true")
                .Replace("False", "false");

            // Add quotes around property names
            pseudoJson = Regex.Replace(pseudoJson, @"(\w+):", @"""$1"":");

            try
            {
                var jsonDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                    "{" + pseudoJson + "}"
                );

                if (jsonDict == null)
                {
                    throw new ValidationException("Invalid agent registration format");
                }

                // Check for required fields
                foreach (string field in REQUIRED_AGENT_FIELDS.Split('|'))
                {
                    if (!jsonDict.ContainsKey(field))
                    {
                        throw new ValidationException($"Missing required field: {field}");
                    }
                }

                // Validate field contents
                ValidateAgentField(jsonDict, "name", MAX_TOOL_NAME_LENGTH);
                ValidateAgentField(jsonDict, "description", MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH);
                ValidateAgentField(jsonDict, "backstory", 1000, 50);
                ValidateAgentField(jsonDict, "goal", 300, 20);

                Console.WriteLine("✅ Agent registration validation passed");
            }
            catch (JsonException jex)
            {
                throw new ValidationException($"Invalid agent registration format: {jex.Message}");
            }
        }

        // ==============================================================
        // VALIDATION UTILITIES
        // ==============================================================
        private static void ValidateParameters(JsonElement paramsElement, string toolName)
        {
            if (paramsElement.ValueKind != JsonValueKind.Array)
            {
                throw new ValidationException("Parameters must be specified as an array");
            }

            foreach (JsonElement param in paramsElement.EnumerateArray())
            {
                if (param.ValueKind != JsonValueKind.Array || param.GetArrayLength() < 3)
                {
                    throw new ValidationException("Each parameter must be a tuple of (name, type, required)");
                }
            }
        }

        private static void ValidateAgentField(Dictionary<string, JsonElement> jsonDict, string fieldName, 
                                             int maxLength, int minLength = 1)
        {
            // Similar to tool field validation but with agent-specific messages
            ValidateToolField(jsonDict, fieldName, maxLength, minLength);
        }

        // ==============================================================
        // REPORTING AND UTILITIES
        // ==============================================================
        private static void GenerateValidationReport(ValidationStatistics stats)
        {
            Console.WriteLine("\n📊 Validation Statistics:");
            Console.WriteLine("========================");
            Console.WriteLine($"📂 Files Processed: {stats.TotalFilesProcessed}");
            Console.WriteLine($"⚠️  Files with Errors: {stats.FilesWithErrors}");
            Console.WriteLine($"\n🛠️  Tools Found: {stats.TotalToolsFound}");
            Console.WriteLine($"✅ Valid Tools: {stats.ValidTools}");
            Console.WriteLine($"❌ Invalid Tools: {stats.InvalidTools}");
            Console.WriteLine($"\n🤖 Agents Found: {stats.TotalAgentsFound}");
            Console.WriteLine($"✅ Valid Agents: {stats.ValidAgents}");
            Console.WriteLine($"❌ Invalid Agents: {stats.InvalidAgents}");
            
            double toolSuccessRate = stats.TotalToolsFound > 0 ? 
                (double)stats.ValidTools / stats.TotalToolsFound * 100 : 0;
            double agentSuccessRate = stats.TotalAgentsFound > 0 ? 
                (double)stats.ValidAgents / stats.TotalAgentsFound * 100 : 0;
            
            Console.WriteLine($"\n📈 Tool Validation Success Rate: {toolSuccessRate:0.0}%");
            Console.WriteLine($"📈 Agent Validation Success Rate: {agentSuccessRate:0.0}%");
            
            if (stats.InvalidTools == 0 && stats.InvalidAgents == 0 && stats.FilesWithErrors == 0)
            {
                Console.WriteLine("\n🎉 All definitions validated successfully!");
            }
            else
            {
                Console.WriteLine("\n🔧 Validation completed with some issues that need attention");
            }
        }

        private static void PrintBanner()
        {
            Console.WriteLine("===============================================");
            Console.WriteLine("=== LYNQ FRAMEWORK DEFINITION VALIDATOR v2.0 ===");
            Console.WriteLine("===============================================");
            Console.WriteLine("A comprehensive validation tool for ensuring");
            Console.WriteLine("Tool and Agent definitions meet all requirements");
            Console.WriteLine("===============================================\n");
        }

        private static void LogError(string message, Exception ex = null)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"⛔ ERROR: {message}");
            if (ex != null)
            {
                Console.WriteLine($"   Exception Details: {ex.GetType().Name}: {ex.Message}");
            }
            Console.ResetColor();
        }
    }

    // ==================================================================
    // SUPPORTING CLASSES
    // ==================================================================
    class ValidationStatistics
    {
        public int TotalFilesProcessed { get; set; }
        public int FilesWithErrors { get; set; }
        public int TotalToolsFound { get; set; }
        public int ValidTools { get; set; }
        public int InvalidTools { get; set; }
        public int TotalAgentsFound { get; set; }
        public int ValidAgents { get; set; }
        public int InvalidAgents { get; set; }
    }

    class ValidationException : Exception
    {
        public ValidationException(string message) : base(message) { }
    }
}