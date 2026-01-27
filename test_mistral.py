#!/usr/bin/env python3
"""
Test script for Mistral integration in LLM Governance Council.

This script verifies that:
1. Mistral model is properly configured
2. Mistral responds successfully via OpenRouter
3. Other council members continue working (graceful degradation)
4. Mistral's Safety Engineer role is active
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.council import run_full_council
from backend.config import MISTRAL_MODEL_ID, COUNCIL_MODELS


async def test_mistral_integration():
    """Test Mistral integration with a Shadow AI governance prompt."""
    
    print("=" * 80)
    print("LLM Governance Council - Mistral Integration Test")
    print("=" * 80)
    print()
    
    # Display configuration
    print("Configuration:")
    print(f"  Mistral Model ID: {MISTRAL_MODEL_ID}")
    print(f"  Total Council Members: {len(COUNCIL_MODELS)}")
    print(f"  Council Models:")
    for i, model in enumerate(COUNCIL_MODELS, 1):
        marker = " (Mistral)" if "mistral" in model.lower() else ""
        print(f"    {i}. {model}{marker}")
    print()
    
    # Test prompt focused on Shadow AI governance
    test_prompt = (
        "Draft a Minimum Viable Governance policy for Shadow AI with enforceable "
        "technical guardrails. Focus on practical controls that can be implemented "
        "within 30-60 days."
    )
    
    print(f"Test Prompt:")
    print(f"  {test_prompt}")
    print()
    print("Running council deliberation...")
    print("-" * 80)
    print()
    
    try:
        # Run the full council process
        stage1_results, stage2_results, stage3_result, metadata = await run_full_council(test_prompt)
        
        # Analyze results
        print("✅ Council deliberation completed successfully!")
        print()
        
        # Check Stage 1 results
        print("Stage 1 - Individual Responses:")
        mistral_responded = False
        other_models_count = 0
        
        for member in metadata.get('council_members', []):
            model_id = member['model']
            role = member['role']
            
            # Find corresponding response
            response_found = any(
                r.get('model') == model_id for r in stage1_results
            )
            
            if response_found:
                if "mistral" in model_id.lower():
                    mistral_responded = True
                    print(f"  ✅ {model_id} ({role}) - RESPONDED")
                else:
                    other_models_count += 1
                    print(f"  ✅ {model_id} ({role}) - responded")
            else:
                print(f"  ❌ {model_id} ({role}) - NO RESPONSE (graceful degradation)")
        
        print()
        
        # Verify Mistral specifically
        if mistral_responded:
            print("✅ PASS: Mistral responded successfully")
            
            # Check if Mistral has Safety Engineer role
            mistral_member = next(
                (m for m in metadata.get('council_members', []) 
                 if "mistral" in m['model'].lower()),
                None
            )
            
            if mistral_member and mistral_member['role'] == "Safety Engineer":
                print("✅ PASS: Mistral has correct role (Safety Engineer)")
            else:
                print(f"⚠️  WARNING: Mistral role is '{mistral_member['role'] if mistral_member else 'N/A'}', expected 'Safety Engineer'")
        else:
            print("❌ FAIL: Mistral did not respond")
            print("   This could be due to:")
            print("   - Invalid API key")
            print("   - Model ID not available on OpenRouter")
            print("   - Rate limiting or timeout")
            return False
        
        # Verify other models still work
        if other_models_count > 0:
            print(f"✅ PASS: {other_models_count} other council members responded (graceful degradation working)")
        else:
            print("⚠️  WARNING: No other models responded")
        
        print()
        
        # Check Stage 3 final synthesis
        if stage3_result and stage3_result.get('response'):
            print("✅ PASS: Stage 3 final synthesis generated successfully")
            
            # Check if synthesis mentions technical controls (Mistral's specialty)
            response_text = stage3_result['response'].lower()
            technical_keywords = ['gateway', 'dlp', 'logging', 'audit', 'control', 'guardrail']
            found_keywords = [kw for kw in technical_keywords if kw in response_text]
            
            if found_keywords:
                print(f"✅ PASS: Final synthesis includes technical controls: {', '.join(found_keywords)}")
            else:
                print("ℹ️  INFO: Final synthesis may not emphasize technical controls")
        else:
            print("❌ FAIL: Stage 3 final synthesis failed")
            return False
        
        print()
        print("=" * 80)
        print("TEST RESULT: ✅ PASSED")
        print("=" * 80)
        print()
        print("Mistral integration is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print()
        print("=" * 80)
        print("TEST RESULT: ❌ FAILED")
        print("=" * 80)
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run the test."""
    # Check if API key is set
    if not os.getenv('OPENROUTER_API_KEY'):
        print("❌ ERROR: OPENROUTER_API_KEY environment variable is not set")
        print()
        print("Please set your OpenRouter API key:")
        print("  export OPENROUTER_API_KEY=your_key_here")
        print()
        print("Or add it to your .env file:")
        print("  OPENROUTER_API_KEY=your_key_here")
        sys.exit(1)
    
    # Run the async test
    result = asyncio.run(test_mistral_integration())
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
