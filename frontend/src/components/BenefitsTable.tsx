import React from 'react';
import { Benefits, BenefitDetail } from '../types';
import CommentIcon from './CommentIcon';

interface BenefitsTableProps {
  benefits: Benefits;
  projectId: string;
  periodId: string;
  onBenefitsUpdate: (benefits: Benefits) => void;
}

const BenefitsTable: React.FC<BenefitsTableProps> = ({
  benefits,
  projectId,
  periodId,
  onBenefitsUpdate
}) => {
  const handleBenefitUpdate = (
    benefitType: keyof Benefits,
    field: keyof BenefitDetail,
    value: string
  ) => {
    const updatedBenefits = {
      ...benefits,
      [benefitType]: {
        ...benefits[benefitType],
        [field]: value
      }
    };
    onBenefitsUpdate(updatedBenefits);
  };

  const benefitTypes = [
    { key: 'fteSavings' as keyof Benefits, label: 'FTE Savings' },
    { key: 'costSavings' as keyof Benefits, label: 'Cost Avoidance / Cost Savings' },
    { key: 'programIntegrity' as keyof Benefits, label: 'Program Integrity' },
    { key: 'clientService' as keyof Benefits, label: 'Client Service' },
    { key: 'other' as keyof Benefits, label: 'Other' }
  ];

  return (
    <div className="benefits-table-container">
      <table className="benefits-table">
        <thead>
          <tr>
            <th>Benefit Type</th>
            <th>Applicable?</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {benefitTypes.map(({ key, label }) => (
            <tr key={key} data-benefit={key}>
              <td>{label}</td>
              <td className="benefit-cell-applicable">
                <select
                  className="benefit-applicable"
                  value={benefits[key].applicable}
                  onChange={(e) => handleBenefitUpdate(key, 'applicable', e.target.value as 'yes' | 'no' | '')}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <CommentIcon
                  fieldRef={`benefits.${key}.applicable`}
                  projectId={projectId}
                  periodId={periodId}
                />
              </td>
              <td className="benefit-cell-details">
                <textarea
                  className="benefit-details"
                  value={benefits[key].details}
                  onChange={(e) => handleBenefitUpdate(key, 'details', e.target.value)}
                  placeholder="Enter details..."
                />
                <CommentIcon
                  fieldRef={`benefits.${key}.details`}
                  projectId={projectId}
                  periodId={periodId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BenefitsTable;