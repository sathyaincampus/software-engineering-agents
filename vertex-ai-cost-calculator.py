#!/usr/bin/env python3
"""
SparkToShip - Vertex AI Deployment Cost Calculator
Estimates monthly costs for running SparkToShip on Vertex AI Agent Engine
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
    
class VertexAICostCalculator:
    """Calculate Vertex AI Agent Engine deployment costs"""
    
    # Pricing (as of December 2025, subject to change)
    AGENT_ENGINE_HOUR = 0.10  # per agent-hour (after free tier)
    
    FIRESTORE_READ = 0.06 / 100_000  # per 100K reads
    FIRESTORE_WRITE = 0.18 / 100_000  # per 100K writes
    FIRESTORE_DELETE = 0.02 / 100_000  # per 100K deletes
    FIRESTORE_STORAGE_GB = 0.18  # per GB/month
    
    CLOUD_STORAGE_STANDARD = 0.020  # per GB/month
    CLOUD_STORAGE_EGRESS = 0.12  # per GB (after 1GB free)
    
    LOAD_BALANCER_FORWARDING_RULE = 18.00  # per month
    LOAD_BALANCER_INGRESS_GB = 0.008  # per GB
    
    # Free tier allowances
    FREE_AGENT_ENGINES = 10  # First 10 agents free
    FREE_AGENT_RUNTIME_HOURS = 100  # Approximate free tier limit
    FREE_FIRESTORE_READS = 50_000  # per day
    FREE_FIRESTORE_WRITES = 20_000  # per day
    FREE_FIRESTORE_DELETES = 20_000  # per day
    FREE_FIRESTORE_STORAGE_GB = 1  # per month
    FREE_CLOUD_STORAGE_EGRESS_GB = 1  # per month
    
    def __init__(self, metrics: UsageMetrics):
        self.metrics = metrics
        
    def calculate_agent_engine_cost(self) -> Dict[str, float]:
        """Calculate Vertex AI Agent Engine costs"""
        # Calculate usage
        total_runtime_minutes = self.metrics.projects_per_month * self.metrics.avg_project_duration_minutes
        total_runtime_hours = total_runtime_minutes / 60
        
        # Monthly requests
        total_requests = self.metrics.requests_per_day * 30
        
        # Agent Engine free tier: First 10 agents are free
        # For single deployment, we're within free tier unless runtime is excessive
        billable_hours = max(0, total_runtime_hours - self.FREE_AGENT_RUNTIME_HOURS)
        agent_cost = billable_hours * self.AGENT_ENGINE_HOUR
        
        within_free_tier = total_runtime_hours <= self.FREE_AGENT_RUNTIME_HOURS
        
        return {
            'agent_cost': agent_cost,
            'total': agent_cost,
            'runtime_hours': total_runtime_hours,
            'total_requests': total_requests,
            'within_free_tier': within_free_tier
        }
    
    def calculate_firestore_cost(self) -> Dict[str, float]:
        """Calculate Firestore costs for session storage"""
        # Estimate Firestore operations based on projects
        # Each project: ~10 reads, ~5 writes per session
        reads_per_month = self.metrics.projects_per_month * 10
        writes_per_month = self.metrics.projects_per_month * 5
        deletes_per_month = self.metrics.projects_per_month * 1  # Cleanup
        
        # Apply free tier (daily limits * 30 days)
        free_reads_monthly = self.FREE_FIRESTORE_READS * 30
        free_writes_monthly = self.FREE_FIRESTORE_WRITES * 30
        free_deletes_monthly = self.FREE_FIRESTORE_DELETES * 30
        
        billable_reads = max(0, reads_per_month - free_reads_monthly)
        billable_writes = max(0, writes_per_month - free_writes_monthly)
        billable_deletes = max(0, deletes_per_month - free_deletes_monthly)
        
        read_cost = billable_reads * self.FIRESTORE_READ
        write_cost = billable_writes * self.FIRESTORE_WRITE
        delete_cost = billable_deletes * self.FIRESTORE_DELETE
        
        # Storage (assume 0.1GB for session data)
        storage_gb = 0.1
        billable_storage = max(0, storage_gb - self.FREE_FIRESTORE_STORAGE_GB)
        storage_cost = billable_storage * self.FIRESTORE_STORAGE_GB
        
        return {
            'read_cost': read_cost,
            'write_cost': write_cost,
            'delete_cost': delete_cost,
            'storage_cost': storage_cost,
            'total': read_cost + write_cost + delete_cost + storage_cost,
            'details': {
                'reads': reads_per_month,
                'writes': writes_per_month,
                'deletes': deletes_per_month
            }
        }
    
    def calculate_cloud_storage_cost(self) -> Dict[str, float]:
        """Calculate Cloud Storage costs"""
        storage_cost = self.metrics.frontend_storage_gb * self.CLOUD_STORAGE_STANDARD
        
        billable_egress = max(0, self.metrics.egress_gb_per_month - self.FREE_CLOUD_STORAGE_EGRESS_GB)
        egress_cost = billable_egress * self.CLOUD_STORAGE_EGRESS
        
        return {
            'storage_cost': storage_cost,
            'egress_cost': egress_cost,
            'total': storage_cost + egress_cost
        }
    
    def calculate_load_balancer_cost(self) -> Dict[str, float]:
        """Calculate Load Balancer costs"""
        if not self.metrics.load_balancer_enabled:
            return {'total': 0}
        
        forwarding_rule_cost = self.LOAD_BALANCER_FORWARDING_RULE
        ingress_cost = self.metrics.egress_gb_per_month * self.LOAD_BALANCER_INGRESS_GB
        
        return {
            'forwarding_rule_cost': forwarding_rule_cost,
            'ingress_cost': ingress_cost,
            'total': forwarding_rule_cost + ingress_cost
        }
    
    def calculate_total_cost(self) -> Dict[str, any]:
        """Calculate total monthly cost"""
        agent_engine = self.calculate_agent_engine_cost()
        firestore = self.calculate_firestore_cost()
        cloud_storage = self.calculate_cloud_storage_cost()
        load_balancer = self.calculate_load_balancer_cost()
        
        total = (
            agent_engine['total'] +
            firestore['total'] +
            cloud_storage['total'] +
            load_balancer['total']
        )
        
        return {
            'agent_engine': agent_engine,
            'firestore': firestore,
            'cloud_storage': cloud_storage,
            'load_balancer': load_balancer,
            'total_monthly_cost': total,
            'total_90_day_cost': total * 3,
            'free_trial_remaining': max(0, 300 - (total * 3)),
            'months_on_free_trial': 300 / total if total > 0 else float('inf')
        }
    
    def print_report(self):
        """Print detailed cost report"""
        costs = self.calculate_total_cost()
        
        print("=" * 70)
        print("SparkToShip - Vertex AI Deployment Cost Estimate")
        print("=" * 70)
        print()
        
        print("Usage Assumptions:") 
        print(f"  • Projects per month: {self.metrics.projects_per_month}")
        print(f"  • Avg project duration: {self.metrics.avg_project_duration_minutes} minutes")
        print(f"  • Requests per day: {self.metrics.requests_per_day}")
        print(f"  • Frontend storage: {self.metrics.frontend_storage_gb} GB")
        print(f"  • Egress per month: {self.metrics.egress_gb_per_month} GB")
        print(f"  • Load Balancer: {'Yes' if self.metrics.load_balancer_enabled else 'No'}")
        print()
        
        print("-" * 70)
        print("Cost Breakdown:")
        print("-" * 70)
        
        # Agent Engine
        ae = costs['agent_engine']
        print(f"Vertex AI Agent Engine (Backend):") 
        print(f"  • Agent runtime:  ${ae['agent_cost']:>8.2f}")
        print(f"  • Subtotal:       ${ae['total']:>8.2f}")
        if ae['within_free_tier']:
            print(f"    ✅ Within free tier! (Runtime: {ae['runtime_hours']:.1f} hours)")
        else:
            print(f"    (Runtime: {ae['runtime_hours']:.1f} hours, Requests: {ae['total_requests']:,})")
        print()
        
        # Firestore
        fs = costs['firestore']
        print(f"Firestore (Session Storage):")
        print(f"  • Read cost:      ${fs['read_cost']:>8.2f}")
        print(f"  • Write cost:     ${fs['write_cost']:>8.2f}")
        print(f"  • Delete cost:    ${fs['delete_cost']:>8.2f}")
        print(f"  • Storage cost:   ${fs['storage_cost']:>8.2f}")
        print(f"  • Subtotal:       ${fs['total']:>8.2f}")
        print(f"    (Reads: {fs['details']['reads']:,}, Writes: {fs['details']['writes']:,})")
        print()
        
        # Cloud Storage
        cs = costs['cloud_storage']
        print(f"Cloud Storage (Frontend):")
        print(f"  • Storage cost:   ${cs['storage_cost']:>8.2f}")
        print(f"  • Egress cost:    ${cs['egress_cost']:>8.2f}")
        print(f"  • Subtotal:       ${cs['total']:>8.2f}")
        print()
        
        # Load Balancer
        lb = costs['load_balancer']
        if self.metrics.load_balancer_enabled:
            print(f"Load Balancer:")
            print(f"  • Forwarding rule:${lb['forwarding_rule_cost']:>8.2f}")
            print(f"  • Ingress cost:   ${lb['ingress_cost']:>8.2f}")
            print(f"  • Subtotal:       ${lb['total']:>8.2f}")
            print()
        
        print("-" * 70)
        print(f"TOTAL MONTHLY COST:  ${costs['total_monthly_cost']:>8.2f}")
        print("-" * 70)
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
        print("Cost Optimization Recommendations:")
        print("=" * 70)
        
        if costs['load_balancer']['total'] > 15:
            print("💡 Load Balancer is your biggest cost component.")
            print("   For development, consider using Agent Engine URLs directly.")
            print()
        
        if costs['agent_engine']['within_free_tier']:
            print("✅ You're within Agent Engine free tier! Excellent.")
            print()
        
        if costs['firestore']['total'] < 1:
            print("✅ Firestore costs are minimal - within free tier!")
            print()
        
        print("💰 Ways to reduce costs:")
        print("   1. Use Cloudflare caching to reduce egress")
        print("   2. Compress frontend assets (reduce storage \u0026 egress)")
        print("   3. Use Agent Engine URLs during development (skip Load Balancer)")
        print("   4. Set agent config: min_instances=0, max_instances=1")
        print("   5. Clean up old Firestore sessions periodically")
        print()

def main():
    parser = argparse.ArgumentParser(
        description='Calculate Vertex AI deployment costs for SparkToShip'
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
        '--load-balancer', 
        action='store_true',
        help='Include Load Balancer costs (default: True)'
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
        load_balancer_enabled=not args.no_load_balancer if args.no_load_balancer else True
    )
    
    calculator = VertexAICostCalculator(metrics)
    calculator.print_report()

if __name__ == '__main__':
    main()
