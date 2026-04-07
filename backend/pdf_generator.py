import os
import logging
from datetime import datetime
from typing import Dict, Any, List
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

logger = logging.getLogger(__name__)

class PDFReportGenerator:
    """Generate professional PDF reports for WillSpend analysis."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom styles for the PDF report."""
        # Custom title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=HexColor('#2E4057'),
            alignment=TA_CENTER
        ))
        
        # Custom heading style
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            textColor=HexColor('#048A81'),
            borderWidth=0,
            borderPadding=5
        ))
        
        # Custom subheading style
        self.styles.add(ParagraphStyle(
            name='CustomSubheading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            textColor=HexColor('#54C6EB')
        ))
        
        # Custom body style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            leading=14
        ))
    
    def _create_summary_table(self, simulation_data: Dict[str, Any]) -> Table:
        """Create summary table of losses by category."""
        data = [['Category', 'Amount Lost', 'Action Hint', '1-Year Recovery']]
        
        categories = simulation_data.get('categories', {})
        for category, details in categories.items():
            amount = f"${details.get('amount', 0):,.2f}"
            action_hint = details.get('action_hint', 'N/A')
            recovery = f"${details.get('estimated_recovery_1year', 0):,.2f}"
            data.append([category, amount, action_hint, recovery])
        
        # Add total row
        total_loss = simulation_data.get('total_inaction_cost', 0)
        data.append(['<b>TOTAL LOSS</b>', f'<b>${total_loss:,.2f}</b>', '', ''])
        
        table = Table(data, colWidths=[2.5*inch, 1.2*inch, 2*inch, 1.2*inch])
        
        # Style the table
        table.setStyle(TableStyle([
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#2E4057')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -2), 10),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#CCCCCC')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
            
            # Total row styling
            ('BACKGROUND', (0, -1), (-1, -1), HexColor('#FFE5E5')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
        ]))
        
        return table
    
    def _create_action_plan_checklist(self, simulation_data: Dict[str, Any]) -> List:
        """Create action plan checklist from top 3 recovery actions."""
        elements = []
        
        elements.append(Paragraph("Action Plan Checklist", self.styles['CustomSubheading']))
        elements.append(Spacer(1, 12))
        
        categories = simulation_data.get('categories', {})
        # Sort by recovery amount (highest first)
        sorted_categories = sorted(
            categories.items(), 
            key=lambda x: x[1].get('estimated_recovery_1year', 0), 
            reverse=True
        )
        
        # Take top 3 actions
        for i, (category, details) in enumerate(sorted_categories[:3], 1):
            action_text = f"""
            <b>{i}. {category}</b><br/>
            Action: {details.get('action_hint', 'Take action')}<br/>
            Expected recovery in 1 year: ${details.get('estimated_recovery_1year', 0):,.2f}<br/>
            <br/>
            <font color="gray">☐ Completed</font>
            """
            elements.append(Paragraph(action_text, self.styles['CustomBody']))
            elements.append(Spacer(1, 8))
        
        return elements
    
    def generate_pdf_report(self, 
                           simulation_data: Dict[str, Any], 
                           user_profile: Dict[str, Any], 
                           ai_advice: str) -> bytes:
        """
        Generate a complete PDF report.
        
        Args:
            simulation_data: Simulation results with categories
            user_profile: User profile information
            ai_advice: AI-generated advice
            
        Returns:
            PDF as bytes
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
            elements = []
            
            # Title
            elements.append(Paragraph("WillSpend Financial Analysis Report", self.styles['CustomTitle']))
            elements.append(Spacer(1, 20))
            
            # Report metadata
            metadata = f"""
            <b>Generated on:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>
            <b>User Profile:</b> Age {user_profile.get('age', 'N/A')}, {user_profile.get('country', 'N/A')}<br/>
            <b>Monthly Income:</b> ${user_profile.get('monthly_income', 0):,.2f}
            """
            elements.append(Paragraph(metadata, self.styles['CustomBody']))
            elements.append(Spacer(1, 20))
            
            # Executive Summary
            elements.append(Paragraph("Executive Summary", self.styles['CustomHeading']))
            total_loss = simulation_data.get('total_inaction_cost', 0)
            num_categories = len(simulation_data.get('categories', {}))
            
            summary = f"""
            This analysis identified a total financial loss of <b>${total_loss:,.2f}</b> due to inaction across 
            <b>{num_categories}</b> categories. The largest opportunity for recovery comes from taking immediate 
            action on your highest-impact items. The detailed breakdown below shows exactly where you're losing 
            money and how much you can recover in the next year.
            """
            elements.append(Paragraph(summary, self.styles['CustomBody']))
            elements.append(Spacer(1, 20))
            
            # Summary Table
            elements.append(Paragraph("Loss Breakdown by Category", self.styles['CustomHeading']))
            elements.append(Spacer(1, 12))
            elements.append(self._create_summary_table(simulation_data))
            elements.append(Spacer(1, 20))
            
            # Page break for detailed sections
            elements.append(PageBreak())
            
            # AI Advice Section
            elements.append(Paragraph("AI Financial Advisor Insights", self.styles['CustomHeading']))
            elements.append(Spacer(1, 12))
            
            # Clean up AI advice for PDF
            clean_advice = ai_advice.replace('##', '').replace('**', '').replace('*', '')
            elements.append(Paragraph(clean_advice, self.styles['CustomBody']))
            elements.append(Spacer(1, 20))
            
            # Action Plan
            elements.append(Paragraph("Your Recovery Action Plan", self.styles['CustomHeading']))
            elements.extend(self._create_action_plan_checklist(simulation_data))
            elements.append(Spacer(1, 20))
            
            # Footer
            elements.append(PageBreak())
            footer_text = """
            <b>About WillSpend</b><br/><br/>
            WillSpend is your financial inaction calculator - helping you understand the real cost of 
            waiting and providing actionable insights to recover lost wealth. This report is generated 
            based on your financial profile and current market conditions.<br/><br/>
            <font color="gray">Generated by WillSpend – your first step to recovering lost wealth.</font>
            """
            elements.append(Paragraph(footer_text, self.styles['CustomBody']))
            
            # Build PDF
            doc.build(elements)
            
            # Get PDF bytes
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info("PDF report generated successfully")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"PDF generation failed: {str(e)}")
            raise Exception(f"Failed to generate PDF report: {str(e)}")

def generate_report_pdf(simulation_data: Dict[str, Any], 
                      user_profile: Dict[str, Any], 
                      ai_advice: str) -> bytes:
    """
    Convenience function to generate PDF report.
    
    Args:
        simulation_data: Simulation results
        user_profile: User profile
        ai_advice: AI-generated advice
        
    Returns:
        PDF as bytes
    """
    generator = PDFReportGenerator()
    return generator.generate_pdf_report(simulation_data, user_profile, ai_advice)
