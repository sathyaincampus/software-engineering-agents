#!/usr/bin/env python3
"""
SparkToShip - Complete Cost Calculator (Infrastructure + Gemini API)
Estimates total monthly costs including GCP infrastructure and Gemini API usage
"""

import argparse
from dataclasses import dataclass
from typing import Dict

@dataclass
class UsageMetrics:
    """Usage metrics for cost calculation"""
    projects_per_month: int
    avg_project_duration_minutes: int
    requests_per_day: int
    frontend_storage_gb: float
    egress_gb_per_month: float
    load_balancer_enabled: bool
    gemini_model: str  # 'flash', 'pro', or 'flash-2'
    
class CompleteCostCalculator:
    """Calculate complete costs: Infrastructure + Gemini API"""
    
    # GCP Infrastructure Pricing
    AGENT_ENGINE_HOUR = 0.10
    FIRESTORE_READ = 0.06 / 100_000
    FIRESTORE_WRITE = 0.18 / 100_000
    FIRESTORE_STORAGE_GB = 0.18
    CLOUD_STORAGE_STANDARD = 0.020
    CLOUD_STORAGE_EGRESS = 0.12
    LOAD_BALANCER_FORWARDING_RULE = 18.00
    LOAD_BALANCER_INGRESS_GB = 0.008
    
    # Gemini API Pricing (per 1M tokens)
    GEMINI_PRICING = {
        'flash-2': {
            'input': 0.075,
            'output': 0.30,
            'name': 'Gemini 2.0 Flash',
            'free_requests_per_day': 1500
        },
        'flash': {
            'input': 0.075,
            'output': 0.30,
            'name': 'Gemini 1.5 Flash',
            'free_requests_per_day': 1500
        },
        'pro': {
            'input': 1.25,
            'output': 5.00,
            'name': 'Gemini 1.5 Pro',
            'free_requests_per_day': 50
        }
    }
    
    # Token usage estimates per project
    TOKENS_PER_PROJECT = {
        'input': 38_000,   # Planning + Architecture + Coding + Debugging
        'output': 20_000   # Generated code + responses
    }
    
    # Free tier allowances
    FREE_AGENT_RUNTIME_HOURS = 100
    FREE_FIRESTORE_READS = 50_000 * 30
    FREE_FIRESTORE_WRITES = 20_000 * 30
    FREE_FIRESTORE_STORAGE_GB = 1
    FREE_CLOUD_STORAGE_EGRESS_GB = 1
    
    def __init__(self, metrics: UsageMetrics):
        self.metrics = metrics
        
    def calculate_infrastructure_cost(self) -> Dict[str, float]:
        """Calculate GCP infrastructure costs (Vertex AI + Firestore + Storage + LB)"""
        # Agent Engine
        total_runtime_minutes = self.metrics.projects_per_month * self.metrics.avg_project_duration_minutes
        total_runtime_hours = total_runtime_minutes / 60
        billable_hours = max(0, total_runtime_hours - self.FREE_AGENT_RUNTIME_HOURS)
        agent_cost = billable_hours * self.AGENT_ENGINE_HOUR
        
        # Firestore
        reads = self.metrics.projects_per_month * 10
        writes = self.metrics.projects_per_month * 5
        billable_reads = max(0, reads - self.FREE_FIRESTORE_READS)
        billable_writes = max(0, writes - self.FREE_FIRESTORE_WRITES)
        firestore_cost = (billable_reads * self.FIRESTORE_READ + 
                         billable_writes * self.FIRESTORE_WRITE)
        
        # Cloud Storage
        storage_cost = self.metrics.frontend_storage_gb * self.CLOUD_STORAGE_STANDARD
        billable_egress = max(0, self.metrics.egress_gb_per_month - self.FREE_CLOUD_STORAGE_EGRESS_GB)
        egress_cost = billable_egress * self.CLOUD_STORAGE_EGRESS
        
        # Load Balancer
        if self.metrics.load_balancer_enabled:
            lb_cost = (self.LOAD_BALANCER_FORWARDING_RULE + 
                      self.metrics.egress_gb_per_month * self.LOAD_BALANCER_INGRESS_GB)
        else:
            lb_cost = 0
        
        total = agent_cost + firestore_cost + storage_cost + egress_cost + lb_cost
        
        return {
            'agent_engine': agent_cost,
            'firestore': firestore_cost,
            'storage': storage_cost + egress_cost,
            'load_balancer': lb_cost,
            'total': total,
            'runtime_hours': total_runtime_hours
        }
    
    def calculate_gemini_cost(self) -> Dict[str, float]:
        """Calculate Gemini API costs"""
        model = self.metrics.gemini_model
        pricing = self.GEMINI_PRICING[model]
        
        # Calculate token usage
        total_input_tokens = self.metrics.projects_per_month * self.TOKENS_PER_PROJECT['input']
        total_output_tokens = self.metrics.projects_per_month * self.TOKENS_PER_PROJECT['output']
        
        # Calculate costs (per million tokens)
        input_cost = (total_input_tokens / 1_000_000) * pricing['input']
        output_cost = (total_output_tokens / 1_000_000) * pricing['output']
        total_cost = input_cost + output_cost
        
        # Check if within free tier
        # Assume ~30 API calls per project (planning, architecture, coding, debugging, iterations)
        api_calls_per_day = (self.metrics.projects_per_month * 30) / 30
        within_free_tier = api_calls_per_day <= pricing['free_requests_per_day']
        
        if within_free_tier:
            actual_cost = 0
            free_tier_savings = total_cost
        else:
            actual_cost = total_cost
            free_tier_savings = 0
        
        return {
            'input_cost': input_cost,
            'output_cost': output_cost,
            'total_cost': total_cost,
            'actual_cost': actual_cost,
            'free_tier_savings': free_tier_savings,
            'within_free_tier': within_free_tier,
            'model_name': pricing['name'],
            'total_input_tokens': total_input_tokens,
            'total_output_tokens': total_output_tokens,
            'api_calls_per_day': api_calls_per_day,
            'free_tier_limit': pricing['free_requests_per_day']
        }
    
    def calculate_total_cost(self) -> Dict[str, any]:
        """Calculate total monthly cost"""
        infrastructure = self.calculate_infrastructure_cost()
        gemini = self.calculate_gemini_cost()
        
        total = infrastructure['total'] + gemini['actual_cost']
        
        return {
            'infrastructure': infrastructure,
            'gemini': gemini,
            'total_monthly_cost': total,
            'total_90_day_cost': total * 3,
            'free_trial_remaining': max(0, 300 - (total * 3)),
            'months_on_free_trial': 300 / total if total > 0 else float('inf')
        }
    
    def print_report(self):
        """Print detailed cost report"""
        costs = self.calculate_total_cost()
        infra = costs['infrastructure']
        gemini = costs['gemini']
        
        print("=" * 70)
        print("SparkToShip - Complete Cost Estimate")
        print("(Infrastructure + Gemini API)")
        print("=" * 70)
        print()
        
        print("Usage Assumptions:")
        print(f"  • Projects per month: {self.metrics.projects_per_month}")
        print(f"  • Avg project duration: {self.metrics.avg_project_duration_minutes} minutes")
        print(f"  • Gemini model: {gemini['model_name']}")
        print(f"  • Frontend storage: {self.metrics.frontend_storage_gb} GB")
        print(f"  • Egress per month: {self.metrics.egress_gb_per_month} GB")
        print(f"  • Load Balancer: {'Yes' if self.metrics.load_balancer_enabled else 'No'}")
        print()
        
        print("-" * 70)
        print("GCP Infrastructure Costs:")
        print("-" * 70)
        print(f"  • Vertex AI Agent Engine:  ${infra['agent_engine']:>8.2f}")
        if infra['runtime_hours'] <= self.FREE_AGENT_RUNTIME_HOURS:
            print(f"    ✅ Within free tier ({infra['runtime_hours']:.1f} hours)")
        else:
            print(f"    (Runtime: {infra['runtime_hours']:.1f} hours)")
        print(f"  • Firestore:               ${infra['firestore']:>8.2f}")
        print(f"  • Cloud Storage:           ${infra['storage']:>8.2f}")
        print(f"  • Load Balancer:           ${infra['load_balancer']:>8.2f}")
        print(f"  • Infrastructure Total:    ${infra['total']:>8.2f}")
        print()
        
        print("-" * 70)
        print(f"Gemini API Costs ({gemini['model_name']}):")
        print("-" * 70)
        print(f"  • Input tokens:  {gemini['total_input_tokens']:>12,} tokens")
        print(f"  • Output tokens: {gemini['total_output_tokens']:>12,} tokens")
        print(f"  • Input cost:              ${gemini['input_cost']:>8.2f}")
        print(f"  • Output cost:             ${gemini['output_cost']:>8.2f}")
        print(f"  • API calls/day:           {gemini['api_calls_per_day']:>8.0f}")
        print(f"  • Free tier limit:         {gemini['free_tier_limit']:>8} requests/day")
        
        if gemini['within_free_tier']:
            print(f"  • ✅ Within free tier!")
            print(f"  • Free tier savings:       ${gemini['free_tier_savings']:>8.2f}")
            print(f"  • Actual API cost:         ${gemini['actual_cost']:>8.2f}")
        else:
            print(f"  • ⚠️  Exceeds free tier")
            print(f"  • Actual API cost:         ${gemini['actual_cost']:>8.2f}")
        print()
        
        print("=" * 70)
        print(f"TOTAL MONTHLY COST:          ${costs['total_monthly_cost']:>8.2f}")
        print("=" * 70)
        print()
        
        print("Cost Breakdown:")
        infra_pct = (infra['total'] / costs['total_monthly_cost'] * 100) if costs['total_monthly_cost'] > 0 else 0
        api_pct = (gemini['actual_cost'] / costs['total_monthly_cost'] * 100) if costs['total_monthly_cost'] > 0 else 0
        print(f"  • Infrastructure: ${infra['total']:>7.2f} ({infra_pct:>5.1f}%)")
        print(f"  • Gemini API:     ${gemini['actual_cost']:>7.2f} ({api_pct:>5.1f}%)")
        print()
        
        print("Free Trial Analysis ($300 credit for 90 days):")
        print(f"  • Cost for 90 days:       ${costs['total_90_day_cost']:>8.2f}")
        print(f"  • Remaining credit:       ${costs['free_trial_remaining']:>8.2f}")
        if costs['months_on_free_trial'] == float('inf'):
            print(f"  • Months on free trial:   Unlimited (within free tier)")
        else:
            print(f"  • Months on free trial:   {costs['months_on_free_trial']:>8.1f} months")
        print()
        
        # Recommendations
        print("=" * 70)
        print("Recommendations:")
        print("=" * 70)
        
        if gemini['within_free_tier']:
            print("✅ You're within Gemini API free tier!")
            print(f"   Saving ${gemini['free_tier_savings']:.2f}/month on API costs")
            print()
        else:
            print("⚠️  You're exceeding Gemini API free tier")
            print(f"   API calls/day: {gemini['api_calls_per_day']:.0f}")
            print(f"   Free tier limit: {gemini['free_tier_limit']} requests/day")
            print()
            
            # Suggest switching to Flash if using Pro
            if self.metrics.gemini_model == 'pro':
                flash_gemini = self.GEMINI_PRICING['flash-2']
                flash_cost = ((gemini['total_input_tokens'] / 1_000_000) * flash_gemini['input'] +
                             (gemini['total_output_tokens'] / 1_000_000) * flash_gemini['output'])
                savings = gemini['total_cost'] - flash_cost
                print(f"💡 Consider switching to Gemini 2.0 Flash:")
                print(f"   Current API cost: ${gemini['total_cost']:.2f}/month")
                print(f"   Flash API cost:   ${flash_cost:.2f}/month")
                print(f"   Savings:          ${savings:.2f}/month ({savings/gemini['total_cost']*100:.0f}% reduction)")
                print()
        
        if infra['runtime_hours'] <= self.FREE_AGENT_RUNTIME_HOURS:
            print("✅ Infrastructure is within free tiers!")
            print()
        
        print("💰 Cost optimization tips:")
        print("   1. Use Gemini 2.0 Flash (94% cheaper than Pro)")
        print("   2. Stay within free tier limits when possible")
        print("   3. Optimize prompts to reduce token usage")
        print("   4. Use Cloudflare caching to reduce egress")
        print("   5. Skip Load Balancer during development (-$18/month)")
        print()

def main():
    parser = argparse.ArgumentParser(
        description='Calculate complete costs for SparkToShip (Infrastructure + Gemini API)'
    )
    parser.add_argument(
        '--projects',
        type=int,
        default=10,
        help='Number of projects per month (default: 10)'
    )
    parser.add_argument(
        '--duration',
        type=int,
        default=7,
        help='Average project duration in minutes (default: 7)'
    )
    parser.add_argument(
        '--requests',
        type=int,
        default=300,
        help='Requests per day (default: 300)'
    )
    parser.add_argument(
        '--storage',
        type=float,
        default=1.0,
        help='Frontend storage in GB (default: 1.0)'
    )
    parser.add_argument(
        '--egress',
        type=float,
        default=10.0,
        help='Egress per month in GB (default: 10.0)'
    )
    parser.add_argument(
        '--model',
        type=str,
        choices=['flash-2', 'flash', 'pro'],
        default='flash-2',
        help='Gemini model: flash-2 (Gemini 2.0 Flash), flash (1.5 Flash), pro (1.5 Pro)'
    )
    parser.add_argument(
        '--no-load-balancer',
        action='store_true',
        help='Exclude Load Balancer costs'
    )
    
    args = parser.parse_args()
    
    metrics = UsageMetrics(
        projects_per_month=args.projects,
        avg_project_duration_minutes=args.duration,
        requests_per_day=args.requests,
        frontend_storage_gb=args.storage,
        egress_gb_per_month=args.egress,
        load_balancer_enabled=not args.no_load_balancer,
        gemini_model=args.model
    )
    
    calculator = CompleteCostCalculator(metrics)
    calculator.print_report()

if __name__ == '__main__':
    main()
