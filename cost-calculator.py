#!/usr/bin/env python3
"""
SparkToShip - Google Cloud Cost Calculator
Estimates monthly costs for running SparkToShip on GCP
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
    min_instances: int
    max_instances: int
    
class GCPCostCalculator:
    """Calculate Google Cloud Platform costs"""
    
    # Pricing (as of December 2025, subject to change)
    CLOUD_RUN_VCPU_SECOND = 0.00002400  # per vCPU-second
    CLOUD_RUN_MEMORY_GB_SECOND = 0.00000250  # per GiB-second
    CLOUD_RUN_REQUEST = 0.40 / 1_000_000  # per request
    
    CLOUD_STORAGE_STANDARD = 0.020  # per GB/month
    CLOUD_STORAGE_EGRESS = 0.12  # per GB (after 1GB free)
    
    LOAD_BALANCER_FORWARDING_RULE = 18.00  # per month
    LOAD_BALANCER_INGRESS_GB = 0.008  # per GB
    
    ARTIFACT_REGISTRY_STORAGE = 0.10  # per GB/month
    
    CLOUD_BUILD_MINUTE = 0.003  # per build-minute (after 120 free/day)
    
    # Free tier allowances
    FREE_CLOUD_RUN_VCPU_SECONDS = 180_000  # per month
    FREE_CLOUD_RUN_MEMORY_GB_SECONDS = 360_000  # per month
    FREE_CLOUD_RUN_REQUESTS = 2_000_000  # per month
    FREE_CLOUD_STORAGE_EGRESS_GB = 1  # per month
    FREE_CLOUD_BUILD_MINUTES = 120 * 30  # per month (120/day)
    
    def __init__(self, metrics: UsageMetrics):
        self.metrics = metrics
        
    def calculate_agent_engine_cost(self) -> Dict[str, float]:
        """Calculate Vertex AI Agent Engine costs"""
        # Agent Engine pricing
        # Free tier: First 10 agents are free
        # Paid tier: $0.10 per agent-hour after free tier
        AGENT_HOUR_PRICE = 0.10
        FREE_AGENTS = 10
        
        # Calculate usage
        total_runtime_minutes = self.metrics.projects_per_month * self.metrics.avg_project_duration_minutes
        total_runtime_hours = total_runtime_minutes / 60
        
        # Monthly requests (assuming 3 requests per project on average)
        total_requests = self.metrics.requests_per_day * 30
        
        # Agent Engine scales automatically, assume 1 agent instance on average
        # Free tier covers first 10 agents (essentially unlimited for single deployment)
        # Most deployments will stay within free tier
        
        # For this calculator, assume we're using 1 agent deployment
        # which is covered by free tier unless we exceed reasonable limits
        
        # Conservative estimate: if runtime > 100 hours/month, start charging
        FREE_RUNTIME_HOURS = 100  # Approximate free tier limit
        
        billable_hours = max(0, total_runtime_hours - FREE_RUNTIME_HOURS)
        agent_cost = billable_hours * AGENT_HOUR_PRICE
        
        within_free_tier = total_runtime_hours <= FREE_RUNTIME_HOURS
        
        return {
            'agent_cost': agent_cost,
            'total': agent_cost,
            'runtime_hours': total_runtime_hours,
            'total_requests': total_requests,
            'within_free_tier': within_free_tier
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
        
        # Estimate ingress (same as egress for simplicity)
        ingress_cost = self.metrics.egress_gb_per_month * self.LOAD_BALANCER_INGRESS_GB
        
        return {
            'forwarding_rule_cost': forwarding_rule_cost,
            'ingress_cost': ingress_cost,
            'total': forwarding_rule_cost + ingress_cost
        }
    
    def calculate_artifact_registry_cost(self) -> Dict[str, float]:
        """Calculate Artifact Registry costs"""
        # Assume 5GB for Docker images
        storage_gb = 5
        storage_cost = storage_gb * self.ARTIFACT_REGISTRY_STORAGE
        
        return {
            'storage_cost': storage_cost,
            'total': storage_cost
        }
    
    def calculate_cloud_build_cost(self) -> Dict[str, float]:
        """Calculate Cloud Build costs"""
        # Assume 10 minutes per build
        builds_per_month = self.metrics.projects_per_month + 10  # +10 for updates
        build_minutes = builds_per_month * 10
        
        billable_minutes = max(0, build_minutes - self.FREE_CLOUD_BUILD_MINUTES)
        build_cost = billable_minutes * self.CLOUD_BUILD_MINUTE
        
        return {
            'build_cost': build_cost,
            'total': build_cost,
            'details': {
                'total_builds': builds_per_month,
                'total_minutes': build_minutes,
                'billable_minutes': billable_minutes
            }
        }
    
    def calculate_total_cost(self) -> Dict[str, any]:
        """Calculate total monthly cost"""
        cloud_run = self.calculate_cloud_run_cost()
        cloud_storage = self.calculate_cloud_storage_cost()
        load_balancer = self.calculate_load_balancer_cost()
        artifact_registry = self.calculate_artifact_registry_cost()
        cloud_build = self.calculate_cloud_build_cost()
        
        total = (
            cloud_run['total'] +
            cloud_storage['total'] +
            load_balancer['total'] +
            artifact_registry['total'] +
            cloud_build['total']
        )
        
        return {
            'cloud_run': cloud_run,
            'cloud_storage': cloud_storage,
            'load_balancer': load_balancer,
            'artifact_registry': artifact_registry,
            'cloud_build': cloud_build,
            'total_monthly_cost': total,
            'total_90_day_cost': total * 3,
            'free_trial_remaining': max(0, 300 - (total * 3)),
            'months_on_free_trial': 300 / total if total > 0 else float('inf')
        }
    
    def print_report(self):
        """Print detailed cost report"""
        costs = self.calculate_total_cost()
        
        print("=" * 70)
        print("SparkToShip - Google Cloud Cost Estimate")
        print("=" * 70)
        print()
        
        print("Usage Assumptions:")
        print(f"  • Projects per month: {self.metrics.projects_per_month}")
        print(f"  • Avg project duration: {self.metrics.avg_project_duration_minutes} minutes")
        print(f"  • Requests per day: {self.metrics.requests_per_day}")
        print(f"  • Frontend storage: {self.metrics.frontend_storage_gb} GB")
        print(f"  • Egress per month: {self.metrics.egress_gb_per_month} GB")
        print(f"  • Load Balancer: {'Yes' if self.metrics.load_balancer_enabled else 'No'}")
        print(f"  • Min instances: {self.metrics.min_instances}")
        print()
        
        print("-" * 70)
        print("Cost Breakdown:")
        print("-" * 70)
        
        # Cloud Run
        cr = costs['cloud_run']
        print(f"Cloud Run (Backend):")
        print(f"  • vCPU cost:      ${cr['vcpu_cost']:>8.2f}")
        print(f"  • Memory cost:    ${cr['memory_cost']:>8.2f}")
        print(f"  • Request cost:   ${cr['request_cost']:>8.2f}")
        print(f"  • Subtotal:       ${cr['total']:>8.2f}")
        print(f"    (Runtime: {cr['details']['runtime_hours']:.1f} hours, "
              f"Requests: {cr['details']['total_requests']:,})")
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
        
        # Artifact Registry
        ar = costs['artifact_registry']
        print(f"Artifact Registry:")
        print(f"  • Storage cost:   ${ar['total']:>8.2f}")
        print()
        
        # Cloud Build
        cb = costs['cloud_build']
        print(f"Cloud Build:")
        print(f"  • Build cost:     ${cb['total']:>8.2f}")
        print(f"    (Builds: {cb['details']['total_builds']}, "
              f"Minutes: {cb['details']['total_minutes']})")
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
        
        if self.metrics.min_instances > 0:
            print("⚠️  You have min_instances > 0, which keeps instances always running.")
            print("   Consider setting to 0 to reduce costs (adds cold start latency).")
            print()
        
        if costs['load_balancer']['total'] > 15:
            print("💡 Load Balancer is your biggest cost component.")
            print("   For development, consider using Cloud Run URLs directly.")
            print()
        
        if costs['cloud_run']['total'] < 5:
            print("✅ You're within Cloud Run free tier! Excellent.")
            print()
        
        print("💰 Ways to reduce costs:")
        print("   1. Set min-instances to 0 (save ~$15-20/month)")
        print("   2. Use Cloudflare caching to reduce egress")
        print("   3. Compress frontend assets (reduce storage & egress)")
        print("   4. Use Cloud Run URLs during development (skip Load Balancer)")
        print("   5. Delete unused Docker images from Artifact Registry")
        print()

def main():
    parser = argparse.ArgumentParser(
        description='Calculate Google Cloud costs for SparkToShip'
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
    parser.add_argument(
        '--min-instances', 
        type=int, 
        default=0,
        help='Minimum Cloud Run instances (default: 0)'
    )
    parser.add_argument(
        '--max-instances', 
        type=int, 
        default=10,
        help='Maximum Cloud Run instances (default: 10)'
    )
    
    args = parser.parse_args()
    
    metrics = UsageMetrics(
        projects_per_month=args.projects,
        avg_project_duration_minutes=args.duration,
        requests_per_day=args.requests,
        frontend_storage_gb=args.storage,
        egress_gb_per_month=args.egress,
        load_balancer_enabled=not args.no_load_balancer if args.no_load_balancer else True,
        min_instances=args.min_instances,
        max_instances=args.max_instances
    )
    
    calculator = GCPCostCalculator(metrics)
    calculator.print_report()

if __name__ == '__main__':
    main()
